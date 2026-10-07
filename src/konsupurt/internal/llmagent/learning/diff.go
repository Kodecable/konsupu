package learning

import (
	"fmt"
	"strings"
)

const (
	diffContext = 3
	// diffCellLimit bounds the line-by-line comparison; larger files are
	// shown as a whole replacement.
	diffCellLimit = 4_000_000
)

type diffOp struct {
	kind byte // ' ', '-' or '+'
	text string
}

// unifiedDiff renders the line difference between two texts as hunks with a
// few lines of context. The header lines of a file diff are left to the
// caller, which already has the path and the status.
func unifiedDiff(before, after string) string {
	old, current := splitLines(before), splitLines(after)
	ops := diffLines(old, current)
	return renderHunks(ops)
}

func splitLines(text string) []string {
	if text == "" {
		return nil
	}
	return strings.Split(strings.TrimSuffix(text, "\n"), "\n")
}

func diffLines(old, current []string) []diffOp {
	prefix := 0
	for prefix < len(old) && prefix < len(current) && old[prefix] == current[prefix] {
		prefix++
	}
	suffix := 0
	for suffix < len(old)-prefix && suffix < len(current)-prefix &&
		old[len(old)-1-suffix] == current[len(current)-1-suffix] {
		suffix++
	}
	var ops []diffOp
	for _, line := range old[:prefix] {
		ops = append(ops, diffOp{' ', line})
	}
	middleOld, middleCurrent := old[prefix:len(old)-suffix], current[prefix:len(current)-suffix]
	ops = append(ops, diffMiddle(middleOld, middleCurrent)...)
	for _, line := range old[len(old)-suffix:] {
		ops = append(ops, diffOp{' ', line})
	}
	return ops
}

// diffMiddle compares what is left once the common prefix and suffix are
// gone, using the longest common subsequence.
func diffMiddle(old, current []string) []diffOp {
	var ops []diffOp
	if len(old) == 0 || len(current) == 0 || len(old)*len(current) > diffCellLimit {
		for _, line := range old {
			ops = append(ops, diffOp{'-', line})
		}
		for _, line := range current {
			ops = append(ops, diffOp{'+', line})
		}
		return ops
	}
	// lengths[i][j] is the LCS length of old[i:] and current[j:].
	lengths := make([][]int32, len(old)+1)
	for i := range lengths {
		lengths[i] = make([]int32, len(current)+1)
	}
	for i := len(old) - 1; i >= 0; i-- {
		for j := len(current) - 1; j >= 0; j-- {
			if old[i] == current[j] {
				lengths[i][j] = lengths[i+1][j+1] + 1
			} else {
				lengths[i][j] = max(lengths[i+1][j], lengths[i][j+1])
			}
		}
	}
	i, j := 0, 0
	for i < len(old) && j < len(current) {
		switch {
		case old[i] == current[j]:
			ops = append(ops, diffOp{' ', old[i]})
			i++
			j++
		case lengths[i+1][j] >= lengths[i][j+1]:
			ops = append(ops, diffOp{'-', old[i]})
			i++
		default:
			ops = append(ops, diffOp{'+', current[j]})
			j++
		}
	}
	for ; i < len(old); i++ {
		ops = append(ops, diffOp{'-', old[i]})
	}
	for ; j < len(current); j++ {
		ops = append(ops, diffOp{'+', current[j]})
	}
	return ops
}

func renderHunks(ops []diffOp) string {
	// keep marks the operations shown: every change and its context.
	keep := make([]bool, len(ops))
	for index, op := range ops {
		if op.kind == ' ' {
			continue
		}
		for near := max(0, index-diffContext); near <= min(len(ops)-1, index+diffContext); near++ {
			keep[near] = true
		}
	}
	var out strings.Builder
	oldLine, newLine := 1, 1
	for index := 0; index < len(ops); {
		if !keep[index] {
			oldLine, newLine = advance(ops[index], oldLine, newLine)
			index++
			continue
		}
		end := index
		for end < len(ops) && keep[end] {
			end++
		}
		oldCount, newCount := 0, 0
		for _, op := range ops[index:end] {
			if op.kind != '+' {
				oldCount++
			}
			if op.kind != '-' {
				newCount++
			}
		}
		fmt.Fprintf(&out, "@@ -%d,%d +%d,%d @@\n", hunkStart(oldLine, oldCount), oldCount, hunkStart(newLine, newCount), newCount)
		for _, op := range ops[index:end] {
			out.WriteByte(op.kind)
			out.WriteString(op.text)
			out.WriteByte('\n')
			oldLine, newLine = advance(op, oldLine, newLine)
		}
		index = end
	}
	return out.String()
}

func advance(op diffOp, oldLine, newLine int) (int, int) {
	if op.kind != '+' {
		oldLine++
	}
	if op.kind != '-' {
		newLine++
	}
	return oldLine, newLine
}

// hunkStart is the line a hunk header names: an empty side points at the
// line before the hunk.
func hunkStart(line, count int) int {
	if count == 0 {
		return line - 1
	}
	return line
}
