"""AgentBreak Command-Line Interface.

Provides deterministic benchmarking, trace replay (cached and live), and golden runs.

Usage:
    python cli.py benchmark [--runs 5]
    python cli.py replay <trace_id> [--live]
    python cli.py golden-run
    python cli.py list-traces
"""

import argparse
import os
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.evaluator.defense_evaluator import DefenseEvaluator
from app.traces.trace_store import TraceStore


def run_benchmark(runs: int = 5, output_file: str = "report.md"):
    """Run full benchmark across all defense configs and write report.md."""
    print(f"\n[+] Running AgentBreak Defense Benchmark (N={runs} runs per attack)...")
    evaluator = DefenseEvaluator()
    results = evaluator.evaluate_all_defenses(runs=runs, save_traces=True)

    report_md = evaluator.generate_report_markdown(results)
    out_path = Path(output_file).resolve()
    out_path.write_text(report_md, encoding="utf-8")
    print(f"[+] Benchmark completed successfully! Report written to: {out_path}\n")

    # Print summary table in terminal
    print("=" * 80)
    print("DEFENSE BENCHMARK SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Defense Configuration':<32} | {'ASR':<8} | {'Block Rate':<10} | {'BTSR':<8} | {'Utility Cost':<12}")
    print("-" * 80)
    for key, data in results.get("matrix", {}).items():
        label = data["label"][:30]
        asr = f"{round(data['asr'] * 100, 1)}%"
        blk = f"{round(data['defense_block_rate'] * 100, 1)}%"
        btsr = f"{round(data['btsr'] * 100, 1)}%"
        cost = f"{round(data['utility_cost'] * 100, 1)}%"
        print(f"{label:<32} | {asr:<8} | {blk:<10} | {btsr:<8} | {cost:<12}")
    print("=" * 80)
    print(f"Replay Consistency: {results.get('replay_consistency_pct', '100.0%')}")
    print("=" * 80 + "\n")
    return results


def run_replay(trace_id: str, live: bool = False):
    """Replay a recorded trace from cache (default) or live model."""
    mode_str = "LIVE MODEL" if live else "LLM RESPONSE CACHE"
    print(f"\n[+] Replaying trace '{trace_id}' using {mode_str}...")
    store = TraceStore()
    try:
        res = store.replay_trace(trace_id, live=live)
    except Exception as exc:
        print(f"[-] Replay failed: {exc}")
        sys.exit(1)

    print("=" * 60)
    print(f"REPLAY RESULT: {trace_id}")
    print("=" * 60)
    print(f"Mode:               {res.get('mode')}")
    print(f"Original Verdict:   Success={res['original_verdict'].get('success')} (Method: {res['original_verdict'].get('method', 'deterministic')})")
    print(f"Replayed Verdict:   Success={res['replayed_verdict'].get('success')} (Method: {res['replayed_verdict'].get('method', 'deterministic')})")
    print(f"Consistency Match:  {'MATCH (Consistent)' if res['is_consistent'] else 'MISMATCH'}")
    print(f"Evidence:           {res['replayed_verdict'].get('evidence')}")
    print("=" * 60 + "\n")


def run_golden_run():
    """Execute golden run: complete benchmark, populates response cache, saves report.md baseline."""
    print("\n[+] Executing Golden Run demo baseline...")
    results = run_benchmark(runs=5, output_file="report.md")
    print("[+] Golden run baseline traces & report.md created.")
    store = TraceStore()
    traces = store.list_traces()
    if traces:
        sample_id = traces[0]["trace_id"]
        print(f"[+] Verifying demo replay against golden trace: {sample_id}")
        run_replay(sample_id, live=False)
    print("[+] Golden Run complete! All demo replays are now cached.\n")


def list_traces_cmd():
    """List available recorded attack traces."""
    store = TraceStore()
    traces = store.list_traces()
    print(f"\n[+] Recorded Traces ({len(traces)} total):")
    for t in traces[:15]:
        tid = t.get("trace_id")
        surf = t.get("surface") or t.get("plan_item", {}).get("surface")
        succ = "VULN" if t.get("verdict", {}).get("success") else "DEFENDED"
        print(f"  - {tid:<12} | Surface: {surf:<18} | Verdict: {succ}")
    if len(traces) > 15:
        print(f"  ... and {len(traces) - 15} more.")
    print()


def main():
    parser = argparse.ArgumentParser(description="AgentBreak Deterministic Security Evaluation CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # benchmark
    bench_parser = subparsers.add_parser("benchmark", help="Run benchmark across all defense configs and benign suite")
    bench_parser.add_argument("--runs", type=int, default=5, help="Number of repeated runs per attack (default: 5)")
    bench_parser.add_argument("--output", type=str, default="report.md", help="Output markdown report file")

    # replay
    replay_parser = subparsers.add_parser("replay", help="Replay a trace from cache or against live model")
    replay_parser.add_argument("trace_id", type=str, help="ID of the trace to replay")
    replay_parser.add_argument("--live", action="store_true", help="Re-run against real model instead of cache")

    # golden-run
    subparsers.add_parser("golden-run", help="Run full benchmark and save golden demo baseline")

    # list-traces
    subparsers.add_parser("list-traces", help="List stored attack traces")

    args = parser.parse_args()

    if args.command == "benchmark":
        run_benchmark(runs=args.runs, output_file=args.output)
    elif args.command == "replay":
        run_replay(args.trace_id, live=args.live)
    elif args.command == "golden-run":
        run_golden_run()
    elif args.command == "list-traces":
        list_traces_cmd()


if __name__ == "__main__":
    main()
