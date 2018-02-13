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

/**
 * Configures the replacer
 *
 * @param {{resolveImports: boolean}=} params
 * @returns {function(string, string)}
 */
function configure(params = {}) {
	return async (source, file) => {
		if (!isStylRgxp.test(file)) {
			return source;
		}

		if (outputCache.has(source)) {
			return outputCache.get(source);
		}

		if (outputCache.size > 1e3) {
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
		outputCache.set(source, tmp = source.replace(
			new RegExp(`@import\\s+"((?:\\.{1,2}\\/|${block.baseBlockName})[^"]*)"`, 'gm'),
			(str, path) => `//#include ${path}`
		));

		return tmp;
	};
}

module.exports = configure;
