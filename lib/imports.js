'use strict';

const
	path = require('upath'),
	{resolve} = require('@pzlr/build-core');

const
	nodeModuleRgxp = /@import "~(.*?\.styl)"/g,
	cache = Object.create(null);

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
		parent = path.dirname(cwd),
		c = cache[parent] = cache[parent] || {};

	if (c[source]) {
		return c[source];
	}

	const
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

	return c[source] = newStr.replace(nodeModuleRgxp, (str, url) => {
		url = path.relative(cwd, path.join(resolve.lib, url));
		return `@import "${url}"`;
	});
}

module.exports = resolveImports;
