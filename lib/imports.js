'use strict';

const
	path = require('upath'),
	{resolve} = require('@pzlr/build-core');

const
	nodeModuleRgxp = /@import "~(.*?\.styl)"/g;

/**
 * Resolves abstract @import declaration from a source string
 *
 * @param {string} source
 * @param {string} file
 * @returns {Promise<string>}
 */
async function resolveImports(source, file) {
	const
		cwd = path.dirname(file),
		importBlockRgxp = /@import "([^./~].*?\.styl)"/g;

	let
		importStatement,
		newStr = source;

	while ((importStatement = importBlockRgxp.exec(source))) {
		const
			url = importStatement[1],
			src = await resolve.block(url, path.dirname(file));

		if (src) {
			newStr = newStr.replace(importStatement[0], `@import "./${path.relative(cwd, src)}"`);
		}
	}

	return newStr.replace(nodeModuleRgxp, (str, url) => {
		url = path.relative(cwd, path.join(resolve.lib, url));
		return `@import "${url}"`;
	});
}

module.exports = resolveImports;
