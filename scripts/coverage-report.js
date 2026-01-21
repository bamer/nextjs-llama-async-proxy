#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Displays a nice formatted coverage report and opens HTML report in browser
 * This script runs after Jest, even if tests fail, to display coverage metrics
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const coverageDir = path.join(projectRoot, "coverage");
const coverageSummaryPath = path.join(coverageDir, "coverage-summary.json");
const htmlReportPath = path.join(coverageDir, "index.html");

/**
 * Format percentage with color
 */
function formatCoveragePercent(percent) {
  const percentStr = percent.toFixed(1).padStart(6, " ");

  if (percent >= 90) return `\x1b[32m${percentStr}%\x1b[0m`; // green
  if (percent >= 80) return `\x1b[33m${percentStr}%\x1b[0m`; // yellow
  return `\x1b[31m${percentStr}%\x1b[0m`; // red
}

/**
 * Display coverage report
 */
function displayCoverageReport() {
  try {
    if (!fs.existsSync(coverageSummaryPath)) {
      console.error("\x1b[31m✗ Coverage report not found\x1b[0m");
      return;
    }

    const summary = JSON.parse(fs.readFileSync(coverageSummaryPath, "utf8"));
    const total = summary.total;

    console.log("\n" + "═".repeat(70));
    console.log(
      "\x1b[36m\x1b[1m               COVERAGE REPORT - TEST SUMMARY               \x1b[0m"
    );
    console.log("═".repeat(70));

    console.log(
      "\n\x1b[1m  Metric         \x1b[0m  |  " +
        "\x1b[1mStatements\x1b[0m  |  " +
        "\x1b[1mBranches\x1b[0m  |  " +
        "\x1b[1mFunctions\x1b[0m  |  " +
        "\x1b[1mLines\x1b[0m"
    );
    console.log("─".repeat(70));

    const metrics = [
      {
        name: "Coverage",
        stmt: total.statements.pct,
        branch: total.branches.pct,
        func: total.functions.pct,
        lines: total.lines.pct,
      },
    ];

    metrics.forEach((m) => {
      console.log(
        `  ${m.name.padEnd(14)}  |  ${formatCoveragePercent(
          m.stmt
        )}  |  ${formatCoveragePercent(m.branch)}  |  ${formatCoveragePercent(
          m.func
        )}  |  ${formatCoveragePercent(m.lines)}`
      );
    });

    console.log("─".repeat(70));
    console.log(`  Statements    : ${total.statements.covered}/${total.statements.total}`);
    console.log(`  Branches      : ${total.branches.covered}/${total.branches.total}`);
    console.log(`  Functions     : ${total.functions.covered}/${total.functions.total}`);
    console.log(`  Lines         : ${total.lines.covered}/${total.lines.total}`);
    console.log("═".repeat(70));

    // File breakdown
    const files = Object.entries(summary)
      .filter(([key]) => key !== "total")
      .map(([file, data]) => ({
        file: file.replace(projectRoot + "/", ""),
        coverage: data.lines.pct,
      }))
      .sort((a, b) => b.coverage - a.coverage);

    if (files.length > 0) {
      console.log("\n\x1b[1mFile Coverage:\x1b[0m\n");
      files.forEach(({ file, coverage }) => {
        const coverageStr = formatCoveragePercent(coverage);
        console.log(`  ${coverageStr}  ${file}`);
      });
    }

    console.log("\n" + "═".repeat(70));
    console.log("\x1b[32m✓ HTML report generated at: coverage/index.html\x1b[0m");
    console.log("\x1b[36m✓ Run 'open coverage/index.html' to view detailed report\x1b[0m");
    console.log("═".repeat(70) + "\n");

    // Open HTML report if available
    if (fs.existsSync(htmlReportPath)) {
      const openCommand = process.platform === "darwin" ? "open" : "xdg-open";
      try {
        spawnSync(openCommand, [htmlReportPath], {
          stdio: "ignore",
          detached: true,
        });
        console.log("\x1b[36m✓ Opening HTML report in browser...\x1b[0m\n");
      } catch (err) {
        // Silently fail if browser doesn't open
      }
    }
  } catch (error) {
    console.error("\x1b[31m✗ Error displaying coverage report:\x1b[0m", error.message);
  }
}

displayCoverageReport();
