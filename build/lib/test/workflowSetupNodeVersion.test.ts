/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { suite, test } from 'node:test';
import * as yaml from 'js-yaml';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const workflowsDir = path.join(repositoryRoot, '.github/workflows');

// Workflow files that were bumped to pin `actions/setup-node@v7` in this change.
// Some files previously pinned `@v6`, and ci.yml previously pinned `@v4`.
const updatedWorkflowFiles = [
	'chat-lib-package.yml',
	'chat-perf.yml',
	'ci.yml',
	'component-fixtures.yml',
	'copilot-setup-steps.yml',
	'css-order-scan.yml',
	'monaco-editor.yml',
	'pr-darwin-test.yml',
	'pr-linux-test.yml',
	'pr-node-modules.yml',
	'pr-win32-test.yml',
	'pr.yml',
	'sessions-e2e.yml',
	'telemetry.yml',
];

// Number of `uses: actions/setup-node@...` steps expected in each updated workflow file.
const expectedSetupNodeStepCounts: Record<string, number> = {
	'chat-lib-package.yml': 1,
	'chat-perf.yml': 4,
	'ci.yml': 1,
	'component-fixtures.yml': 1,
	'copilot-setup-steps.yml': 1,
	'css-order-scan.yml': 1,
	'monaco-editor.yml': 1,
	'pr-darwin-test.yml': 1,
	'pr-linux-test.yml': 1,
	'pr-node-modules.yml': 6,
	'pr-win32-test.yml': 1,
	'pr.yml': 5,
	'sessions-e2e.yml': 1,
	'telemetry.yml': 1,
};

const expectedSetupNodeUses = 'actions/setup-node@v7';
const outdatedSetupNodeReference = /actions\/setup-node@v[1-6](?:[^0-9]|$)/;

interface WorkflowStep {
	uses?: string;
	[key: string]: unknown;
}

interface WorkflowJob {
	steps?: WorkflowStep[];
	[key: string]: unknown;
}

interface WorkflowDocument {
	jobs?: Record<string, WorkflowJob>;
	[key: string]: unknown;
}

function readWorkflowContents(fileName: string): string {
	return fs.readFileSync(path.join(workflowsDir, fileName), 'utf8');
}

function parseWorkflow(fileName: string): WorkflowDocument {
	return yaml.load(readWorkflowContents(fileName)) as WorkflowDocument;
}

function collectUsesValues(document: WorkflowDocument): string[] {
	const usesValues: string[] = [];
	for (const job of Object.values(document.jobs ?? {})) {
		for (const step of job.steps ?? []) {
			if (typeof step.uses === 'string') {
				usesValues.push(step.uses);
			}
		}
	}
	return usesValues;
}

function collectSetupNodeUses(document: WorkflowDocument): string[] {
	return collectUsesValues(document).filter(uses => uses.startsWith('actions/setup-node@'));
}

suite('GitHub Actions workflow setup-node version', () => {

	test('all updated workflow files exist under .github/workflows', () => {
		for (const fileName of updatedWorkflowFiles) {
			assert.ok(fs.existsSync(path.join(workflowsDir, fileName)), `${fileName} should exist`);
		}
	});

	for (const fileName of updatedWorkflowFiles) {

		test(`${fileName} is valid YAML`, () => {
			assert.doesNotThrow(() => parseWorkflow(fileName));
		});

		test(`${fileName} pins every actions/setup-node step to v7`, () => {
			const setupNodeUses = collectSetupNodeUses(parseWorkflow(fileName));
			assert.ok(setupNodeUses.length > 0, `expected at least one actions/setup-node step in ${fileName}`);
			for (const uses of setupNodeUses) {
				assert.strictEqual(uses, expectedSetupNodeUses, `${fileName} should pin actions/setup-node to v7, found ${uses}`);
			}
		});

		test(`${fileName} has the expected number of actions/setup-node steps`, () => {
			const setupNodeUses = collectSetupNodeUses(parseWorkflow(fileName));
			assert.strictEqual(setupNodeUses.length, expectedSetupNodeStepCounts[fileName]);
		});

		test(`${fileName} does not reference an outdated setup-node version`, () => {
			const contents = readWorkflowContents(fileName);
			assert.ok(!outdatedSetupNodeReference.test(contents), `${fileName} should not reference actions/setup-node@v1-v6`);
		});
	}

	test('total number of actions/setup-node steps across updated workflows matches expected count', () => {
		const total = updatedWorkflowFiles.reduce(
			(sum, fileName) => sum + collectSetupNodeUses(parseWorkflow(fileName)).length,
			0
		);
		assert.strictEqual(total, Object.values(expectedSetupNodeStepCounts).reduce((sum, count) => sum + count, 0));
	});

	test('telemetry.yml pins the single-quoted setup-node reference to v7', () => {
		// telemetry.yml declares `uses` as a single-quoted YAML scalar; verify the
		// parsed value is unaffected by the quoting style used in the source file.
		assert.deepStrictEqual(collectSetupNodeUses(parseWorkflow('telemetry.yml')), ['actions/setup-node@v7']);
	});

	test('ci.yml was bumped directly from v4 to v7', () => {
		assert.deepStrictEqual(collectSetupNodeUses(parseWorkflow('ci.yml')), ['actions/setup-node@v7']);
	});

	test('unrelated actions/checkout pins were left untouched by the setup-node bump', () => {
		for (const fileName of updatedWorkflowFiles) {
			const checkoutUses = collectUsesValues(parseWorkflow(fileName)).filter(uses => uses.startsWith('actions/checkout@'));
			for (const uses of checkoutUses) {
				assert.strictEqual(uses, 'actions/checkout@v7', `${fileName} should still pin actions/checkout to v7`);
			}
		}
	});

	test('outdated setup-node regex does not falsely flag v7 references', () => {
		assert.ok(!outdatedSetupNodeReference.test('uses: actions/setup-node@v7'));
		assert.ok(outdatedSetupNodeReference.test('uses: actions/setup-node@v6'));
		assert.ok(outdatedSetupNodeReference.test('uses: actions/setup-node@v4'));
	});
});