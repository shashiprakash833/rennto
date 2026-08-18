import json

# Read lint report
try:
    with open('lint_report.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
except Exception as e:
    print(f"Could not load lint_report.json: {e}")
    exit(1)

messages = data[0]['messages']
dupe_lines = set()
for m in messages:
    if m['ruleId'] == 'no-dupe-keys':
        dupe_lines.add(m['line'])

# Read translations.js
with open('src/utils/translations.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The second `hi: {` block is at line 406, and ends at 761.
# Let's see if 406 is indeed `hi: {`
if 406 in dupe_lines and "hi:" in lines[405]:
    # We will delete from 406 to the end of that block.
    # We know line 761 is `  },` before `te: {` at 762.
    # Let's dynamically find the end of the block.
    start_idx = 405
    end_idx = start_idx
    brace_count = 0
    for i in range(start_idx, len(lines)):
        if "{" in lines[i]: brace_count += lines[i].count("{")
        if "}" in lines[i]: brace_count -= lines[i].count("}")
        if brace_count == 0:
            end_idx = i
            break
    
    # Remove those lines from the dupe_lines set so we don't double process
    for i in range(start_idx, end_idx + 1):
        if (i + 1) in dupe_lines:
            dupe_lines.remove(i + 1)
            
    # Also delete the lines from the file
    for i in range(start_idx, end_idx + 1):
        lines[i] = None

# Now delete the remaining duplicate lines
for line_num in dupe_lines:
    lines[line_num - 1] = None

# Write back
with open('src/utils/translations.js', 'w', encoding='utf-8') as f:
    for line in lines:
        if line is not None:
            f.write(line)

print(f"Fixed {len(dupe_lines)} individual duplicate keys and the duplicate 'hi' block.")
