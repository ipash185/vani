#!/usr/bin/env python3
"""
scorer.py

Phoneme-aware sentence scorer. CLI & small JSON-over-stdout responder.
Usage:
  python3 scorer.py --target "That is why." --spoken "That's why."
  or
  echo '{"target":"...","spoken":"..."}' | python3 scorer.py --json
"""

import argparse
import json
import re
from functools import lru_cache

# External libs
# pip install pronouncing jellyfish python-Levenshtein
import pronouncing
import jellyfish
import Levenshtein as Lev

# --------------------------
# Configuration / thresholds
# --------------------------
HOMOPHONE_THRESHOLD = 0.20   # <= this -> treat as homophone (very similar)
ERROR_THRESHOLD = 0.45       # > this -> flag as misspoken
SUB_COST_WEIGHT = 1.0
INS_COST = 1.0
DEL_COST = 1.0

# Contractions map (extend as needed)
CONTRACTIONS = {
    "that's": "that is", "it's": "it is", "i'm": "i am", "you're": "you are", "don't": "do not", "can't": "can not", "won't": "will not", "he's": "he is", "she's": "she is", "they're": "they are", "couldn't": "could not", "shouldn't": "should not", "we're": "we are", "i've": "i have", "i'd": "i would", "i'll": "i will", "you've": "you have", "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "haven't": "have not", "hasn't": "has not", "hadn't": "had not", "doesn't": "does not", "didn't": "did not", "mightn't": "might not", "mustn't": "must not", "needn't": "need not", "oughtn't": "ought not", "daren't": "dare not", "you'll": "you will", "you'd": "you would", "he'll": "he will", "he'd": "he would", "she'll": "she will", "she'd": "she would", "it'll": "it will", "it'd": "it would", "we've": "we have", "we'll": "we will", "we'd": "we would", "they've": "they have", "they'll": "they will", "they'd": "they would", "that'll": "that will", "that'd": "that would", "what's": "what is", "what're": "what are", "what'll": "what will", "what'd": "what would", "who's": "who is", "who're": "who are", "who'll": "who will", "who'd": "who would", "where's": "where is", "where're": "where are", "where'll": "where will", "where'd": "where would", "when's": "when is", "when're": "when are", "when'll": "when will", "when'd": "when would", "why's": "why is", "why're": "why are", "why'll": "why will", "why'd": "why would", "how's": "how is", "how're": "how are", "how'll": "how will", "how'd": "how would", "there's": "there is", "there're": "there are", "there'll": "there will", "there'd": "there would", "here's": "here is", "here're": "here are", "let's": "let us", "something's": "something is", "everything's": "everything is", "nothing's": "nothing is", "everybody's": "everybody is", "someone's": "someone is", "o'clock": "of the clock", "ma'am": "madam", "'tis": "it is", "'twas": "it was", "gonna": "going to", "wanna": "want to", "gotta": "got to", "gimme": "give me", "lemme": "let me", "kinda": "kind of", "sorta": "sort of", "outta": "out of", "lotsa": "lots of", "shoulda": "should have", "coulda": "could have", "woulda": "would have", "mighta": "might have", "musta": "must have"
}

# --------------------------
# Utilities
# --------------------------
def normalize_text(text):
    if text is None:
        return ""
    text = text.lower()
    # expand contractions simple pass
    for c, e in CONTRACTIONS.items():
        text = re.sub(r"\b" + re.escape(c) + r"\b", e, text)
    # remove punctuation (keep apostrophes already handled)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

@lru_cache(maxsize=20000)
def cmu_prons(word):
    # returns list of pron strings or empty list
    return pronouncing.phones_for_word(word) or []

def pron_to_phonemes(pron):
    return pron.split()

def phoneme_distance(a_list, b_list):
    # normalized edit distance on phoneme lists
    la, lb = len(a_list), len(b_list)
    if la == 0 and lb == 0:
        return 0.0
    # DP
    dp = [[0] * (lb + 1) for _ in range(la + 1)]
    for i in range(la + 1):
        dp[i][0] = i
    for j in range(lb + 1):
        dp[0][j] = j
    for i in range(1, la + 1):
        for j in range(1, lb + 1):
            cost = 0 if a_list[i-1] == b_list[j-1] else 1
            dp[i][j] = min(dp[i-1][j] + 1, dp[i][j-1] + 1, dp[i-1][j-1] + cost)
    edit = dp[la][lb]
    return edit / max(la, lb)

def double_metaphone_codes(word):
    # use jellyfish.metaphone (single code), but we can use Lev on the results
    code = jellyfish.metaphone(word)
    return code if code else ""

def word_substitution_cost(expected, spoken):
    # exact match quick path
    if expected == spoken:
        return 0.0

    ex_prons = cmu_prons(expected)
    sp_prons = cmu_prons(spoken)

    best = 1.0
    if ex_prons and sp_prons:
        for ep in ex_prons:
            for sp in sp_prons:
                pd = phoneme_distance(pron_to_phonemes(ep), pron_to_phonemes(sp))
                if pd < best:
                    best = pd
        return best

    # fallback: metaphone + normalized Levenshtein on the codes
    ex_m = double_metaphone_codes(expected)
    sp_m = double_metaphone_codes(spoken)
    if ex_m and sp_m:
        ed = Lev.distance(ex_m, sp_m)
        best = ed / max(1, max(len(ex_m), len(sp_m)))
        return min(1.0, best)

    # final fallback: normalized char-level Levenshtein
    ed = Lev.distance(expected, spoken)
    return ed / max(1, max(len(expected), len(spoken)))

# --------------------------
# Alignment DP
# --------------------------
def align_expected_to_spoken(expected_words, spoken_words):
    m, n = len(expected_words), len(spoken_words)
    # dp cost matrix
    dp = [[0.0] * (n + 1) for _ in range(m + 1)]
    op = [[None] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        dp[i][0] = dp[i-1][0] + DEL_COST
        op[i][0] = ("del", expected_words[i-1], None, 1.0)
    for j in range(1, n + 1):
        dp[0][j] = dp[0][j-1] + INS_COST
        op[0][j] = ("ins", None, spoken_words[j-1], 1.0)

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            wd = word_substitution_cost(expected_words[i-1], spoken_words[j-1])
            sub_cost = SUB_COST_WEIGHT * wd
            if expected_words[i-1] == spoken_words[j-1]:
                sub_cost = 0.0

            choices = [
                (dp[i-1][j] + DEL_COST, ("del", expected_words[i-1], None, 1.0)),
                (dp[i][j-1] + INS_COST, ("ins", None, spoken_words[j-1], 1.0)),
                (dp[i-1][j-1] + sub_cost, ("sub", expected_words[i-1], spoken_words[j-1], wd)),
            ]
            best = min(choices, key=lambda x: x[0])
            dp[i][j] = best[0]
            op[i][j] = best[1]

    # backtrack
    i, j = m, n
    alignment = []
    while i > 0 or j > 0:
        cur = op[i][j]
        if cur is None:
            break
        typ = cur[0]
        if typ == "del":
            alignment.append({"op": "delete", "expected": cur[1], "spoken": None, "cost": cur[3]})
            i -= 1
        elif typ == "ins":
            alignment.append({"op": "insert", "expected": None, "spoken": cur[2], "cost": cur[3]})
            j -= 1
        else:  # sub
            _, expw, spw, wd = cur
            # determine semantic tag: homophone / correct / mispronounced / wrong
            tag = "substitution"
            if wd <= HOMOPHONE_THRESHOLD:
                tag = "homophone"
            elif wd <= 0.15:
                tag = "correct_pronunciation"
            elif wd <= ERROR_THRESHOLD:
                tag = "mispronounced"
            else:
                tag = "wrong"
            alignment.append({"op": "substitute", "expected": expw, "spoken": spw, "phoneme_distance": round(wd, 4), "tag": tag, "cost": wd})
            i -= 1
            j -= 1

    alignment.reverse()
    total_cost = dp[m][n]
    return alignment, total_cost

# --------------------------
# Scoring wrapper
# --------------------------
def score_pair(target_sentence, spoken_sentence):
    tkn_t = [w for w in normalize_text(target_sentence).split() if w]
    tkn_s = [w for w in normalize_text(spoken_sentence).split() if w]

    alignment, total_cost = align_expected_to_spoken(tkn_t, tkn_s)

    # collect misspoken list
    misspoken = []
    for item in alignment:
        if item["op"] == "substitute":
            if item["phoneme_distance"] > ERROR_THRESHOLD:
                misspoken.append({"expected": item["expected"], "spoken": item["spoken"], "distance": item["phoneme_distance"], "tag": item["tag"]})

    # counts
    counts = {"expected_words": len(tkn_t), "spoken_words": len(tkn_s),
              "substitutions": sum(1 for a in alignment if a["op"] == "substitute"),
              "insertions": sum(1 for a in alignment if a["op"] == "insert"),
              "deletions": sum(1 for a in alignment if a["op"] == "delete")}

    # scoring: convert total_cost into 0..100
    normalization = max(1, len(tkn_t))
    raw = 1.0 - (total_cost / (normalization * max(INS_COST, DEL_COST, SUB_COST_WEIGHT)))
    score_percent = max(0.0, min(1.0, raw)) * 100.0

    result = {
        "score": round(score_percent, 2),
        "alignment": alignment,
        "misspoken": misspoken,
        "total_cost": round(total_cost, 4),
        "counts": counts,
        "target_normalized": " ".join(tkn_t),
        "spoken_normalized": " ".join(tkn_s)
    }
    return result

# --------------------------
# CLI / JSON interface
# --------------------------
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target", "-t", help="Target expected sentence", type=str)
    parser.add_argument("--spoken", "-s", help="Spoken/transcribed sentence", type=str)
    parser.add_argument("--json", action="store_true", help="Read JSON from stdin with {target,spoken}")
    args = parser.parse_args()

    if args.json:
        raw = ""
        import sys
        raw = sys.stdin.read()
        data = json.loads(raw)
        target = data.get("target", "")
        spoken = data.get("spoken", "")
    else:
        target = args.target or ""
        spoken = args.spoken or ""

    out = score_pair(target, spoken)
    print(json.dumps(out, ensure_ascii=False))

if __name__ == "__main__":
    main()

