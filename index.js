'use strict';

const
	resolveImports = require('./lib/imports'),
	block = require('@pzlr/build-core').validators,
	{defineRgxp, expandDefine} = /** @type {{defineRgxp: RegExp, expandDefine: Function}} */ require('./lib/inheritance');

const
	isStylRgxp = /\.styl$/,
	isModRgxp = /(_[a-z0-9-]+_[a-z0-9-]+).styl$/;

let
	outputCache = new Map();

const
	pendingFiles = new Map();

/**
 * Configures the replacer
 *
 * @param {{resolveImports: boolean, cacheSize: number}=} params
 * @returns {function(string, string)}
 */
function configure(params = {}) {
	const {cacheSize = 1e4} = params;

	return async (source, file) => {
		if (!isStylRgxp.test(file)) {
			return source;
		}

		const cacheKey = file;

		// Wait for pending tasks to finish to prevent cache data race
		await pendingFiles.get(cacheKey);

		if (outputCache.has(cacheKey)) {
			return outputCache.get(cacheKey);
		}

		let done;
		pendingFiles.set(cacheKey, new Promise((resolve) => done = resolve));

		if (outputCache.size > cacheSize) {
			outputCache = new Map();
		}

		const
			isMod = isModRgxp.test(file);

		while (defineRgxp.test(source)) {
			source = expandDefine(source, isMod);
		}

		if (params.resolveImports) {
			source = await resolveImports(source, file);
		}

		let tmp;
		outputCache.set(cacheKey, tmp = source.replace(
			new RegExp(`@import\\s+"((?:\\.{1,2}\\/|${block.baseBlockName})[^"]*)"`, 'gm'),
			(str, path) => `//#include ${path}`
		));

		done();

		return tmp;
	};
}

module.exports = configure;

Object.assign(module.exports, {
	removeFromCache
});

/**
 * Removes the specified files from the cache.
 * Should be used to remove modified files in webpack watch mode.
 *
 * @param {Iterable<string>} files
 * @returns {void}
 */
function removeFromCache(files) {
	for (const file of files) {
		outputCache.delete(file);
	}
}
