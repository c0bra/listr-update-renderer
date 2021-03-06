'use strict';
const logUpdate = require('log-update');
const chalk = require('chalk');
const figures = require('figures');
const indentString = require('indent-string');
const cliTruncate = require('cli-truncate');
const stripAnsi = require('strip-ansi');
const utils = require('./lib/utils');

const renderHelper = (tasks, options, level) => {
	level = level || 0;

	let output = [];

	for (const task of tasks) {
		const skipped = task.isSkipped() ? ` ${chalk.dim('[skipped]')}` : '';

		output.push(indentString(` ${utils.getSymbol(task, options)} ${task.title}${skipped}`, level, '  '));

		if ((task.isPending() || task.isSkipped()) && task.output) {
			const lastLine = task.output.trim().split('\n').filter(Boolean).pop();

			if (lastLine) {
				const out = indentString(`${figures.arrowRight} ${lastLine.trim()}`, level, '  ');
				output.push(`   ${cliTruncate(out, process.stdout.columns - 3)}`);
			}
		}

		if ((task.isPending() || task.hasFailed() || options.collapse === false) && (task.hasFailed() || options.showSubtasks !== false) && task.subtasks.length > 0) {
			output = output.concat(renderHelper(task.subtasks, options, level + 1));
		}
	}

	return output.join('\n');
};

const render = (tasks, options) => {
	logUpdate(renderHelper(tasks, options));
};

class UpdateRenderer {

	constructor(tasks, options) {
		this._tasks = tasks;
		this._options = Object.assign({
			showSubtasks: true,
			collapse: true
		}, options);
	}

	render() {
		if (this._id) {
			// Do not render if we are already rendering
			return;
		}

		this._id = setInterval(() => {
			render(this._tasks, this._options);
		}, 100);
	}

	end() {
		if (this._id) {
			clearInterval(this._id);
			this._id = undefined;
		}

		render(this._tasks, this._options);
		logUpdate.done();
	}
}

module.exports = UpdateRenderer;
