let pyodideReady = false;

async function init() {
    window.pyodide = await loadPyodide();

    // Load your Python code into Pyodide
    await pyodide.runPythonAsync(`
import itertools
from functools import lru_cache

EPS = 1e-6

def solve_24(nums):
    if len(nums) != 4:
        return None

    initial = [(float(n), str(n)) for n in nums]

    @lru_cache(maxsize=1000)
    def dfs(state):
        numbers = list(state)

        if len(numbers) == 1:
            val, expr = numbers[0]
            if abs(val - 24) < EPS:
                return expr
            return None

        n = len(numbers)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue

                a_val, a_expr = numbers[i]
                b_val, b_expr = numbers[j]

                rest = [numbers[k] for k in range(n) if k != i and k != j]

                candidates = [
                    (a_val + b_val, f"({a_expr}+{b_expr})"),
                    (a_val - b_val, f"({a_expr}-{b_expr})"),
                    (b_val - a_val, f"({b_expr}-{a_expr})"),
                    (a_val * b_val, f"({a_expr}*{b_expr})"),
                ]

                if abs(b_val) > EPS:
                    candidates.append((a_val / b_val, f"({a_expr}/{b_expr})"))
                if abs(a_val) > EPS:
                    candidates.append((b_val / a_val, f"({b_expr}/{a_expr})"))

                for val, expr in candidates:
                    new_state = tuple(sorted(rest + [(val, expr)]))
                    result = dfs(new_state)
                    if result:
                        return result

        return None

    for perm in itertools.permutations(initial):
        state = tuple(sorted(perm))
        result = dfs(state)
        if result:
            return result

    return None
  `);

    pyodideReady = true;
}

async function run() {
    const out = document.getElementById("out");

    if (!pyodideReady) {
        out.textContent = "Loading Python...";
        return;
    }

    const input = document.getElementById("nums").value;
    const nums = input.split(",").map(Number);

    try {
        // Call Python function
        const result = await pyodide.runPythonAsync(`
solve_24(${JSON.stringify(nums)})
    `);

        out.textContent = result || "No solution";
    } catch (e) {
        out.textContent = "Error: " + e;
    }
}

init();