'use strict';

const
	String = require('sugar').String,
	escaper = require('escaper'),
	block = require('@pzlr/build-core').validators;

const
	paramsStartReg = /^\s*\$p\s*=\s*(?={)/m,
	defineReg = new RegExp(`^(${block.baseBlockName})(?:\\s+extends\\s+(${block.baseBlockName}))?$`, 'm'),
	varsReg = /\$p\.[.\w$]+/g;

/**
 * Returns block parameters from a string
 *
 * @param {string} str
 * @returns {string}
 */
function getBlockParams(str) {
	str = escaper.replace(str);

	let res = '{';
	let balance = 1;

	for (let i = 1; (i < str.length) && balance; ++i) {
		const char = str[i];

		if (char === '{') {
			++balance;

		} else if (char === '}') {
			--balance;
		}

		res += char;
	}

	if (balance) {
		throw new Error(`Can't extract params`);
	}

	return escaper.paste(res);
}

/**
 * Expands block declaration from a source text
 *
 * @param {string} source
 * @param {boolean=} [isMod]
 * @returns {string}
 */
function expandDefine(source, isMod) {
	const
		define = defineReg.exec(source);

	if (!define) {
		return source;
	}

	const
		[, block, parent] = define,
		paramsStartSearch = paramsStartReg.exec(source);

	function addToParams(val) {
		val = `\n\t${val}${paramsBlock.length > 2 ? ',' : ''}\n`;
		paramsBlock = paramsBlock[0] + val + paramsBlock.slice(1);
	}

	let paramsBlock;
	if (paramsStartSearch) {
		const [start] = paramsStartSearch;
		paramsBlock = getBlockParams(source.substr(paramsStartSearch.index + start.length));
		source = source.replace(start + paramsBlock, '');

	} else {
		paramsBlock = '{}';
	}

	const
		mod = isMod && block.replace(/[^_]+/, ''),
		modName = mod && mod.split('_')[1];

	if (isMod && modName) {
		addToParams(`${modName}: ${block.replace(/[^_]+/, '')}`);
	}

	const
		id = Math.random().toString().split('.')[1],
		blockName = String.camelize(block, false),
		blockVar = `$${blockName}`,
		parentVar = `$${String.camelize(parent || '', false)}`;

	const
		paramsVar = `${blockVar}Params`,
		blockExt = `${isMod ? parentVar : blockVar}ExtName`,
		blockI = `${blockVar}PartialCursor`,
		blockPartials = `${blockVar}PartialList`;

	/* eslint-disable indent */

	let fullDefineString = `
if lookup('${blockVar}') == null
	${!isMod ? `${blockVar} = ()` : ''}
	${blockI} = 0
	${blockPartials} = ()
	push(${blockPartials}, '${block}')
	${!isMod ? `${blockExt} = '${parent ? parentVar : ''}'` : ''}
	push(${isMod ? parentVar : blockVar}, '${blockPartials}')

else
	${blockI} += 1
	push(${blockPartials}, '${block}__' + ${blockI})

if lookup('${paramsVar}') == null {
	${paramsVar} = ${
		isMod ?
			`fork(${blockExt} && lookup(${blockExt} + '${String.camelize(mod)}') || ${parentVar}Params, ${paramsBlock})` :
			parent ? `fork(${parentVar}Params, ${paramsBlock})` : paramsBlock
	}

} else {
	${paramsVar} = fork(${paramsVar}, ${paramsBlock})
}

_${block}__${id}($p)
	$p = fork(${paramsVar}, $p)
	${parent && !isMod ? `extends(${parentVar}, $p)` : ''}
`;

	/* eslint-enable indent */

	fullDefineString = fullDefineString
		.split(/\r?\n|\r/)
		.filter((s) => !String.isBlank(s))
		.join('\n');

	if (isMod) {
		source = source.replace(new RegExp(`\\/(${modName})\\b`, 'g'), '&{$p.$1}');
	}

	const
		vars = {};

	source = source.replace(varsReg, (val) => vars[val] = val.replace(/\./g, '__'));
	Object.keys(vars).sort().forEach((key) => fullDefineString += `\n\t${vars[key]} = ${key}`);

	const
		includeBlock = `+:${blockName}`,
		excludeBlock = `-:${blockName}`;

	return `${source.replace(defineReg, fullDefineString)}

define('${block}' + (${blockI} > 0 ? '__' + ${blockI} : ''), _${block}__${id})

//#label partial
//#if +:*
//#unless ${excludeBlock}
//#if +:* typeof function
//#include ${block}-\${+:*}@(.styl)::
//#endif
//#unless +:* typeof function
//#include ${block}-*.styl::
//#endunless
//#endunless
//#endif

//#if ${includeBlock}
//#unless ${excludeBlock}
//#if ${includeBlock} typeof function
//#include ${block}-\${${includeBlock}}@(.styl)::
//#endif
//#unless ${includeBlock} typeof function
//#include ${block}-*.styl::
//#endunless
//#endunless
//#endif

//#include ${block}_*.styl::
//#endlabel
`;
}

let
	cache = new Map();

/**
 * @param {string} source
 * @param {string} file
 * @returns {string}
 */
module.exports = (source, file) => {
	if (!/\.styl$/.test(file)) {
		return source;
	}

	if (cache.has(source)) {
		return cache.get(source);
	}

	if (cache.size > 1e3) {
		cache = new Map();
	}

	const isMod = /(_[a-z0-9-]+_[a-z0-9-]+).styl$/.test(file);
	while (defineReg.test(source)) {
		source = expandDefine(source, isMod);
	}

	let tmp;
	cache.set(source, tmp = source.replace(
		new RegExp(`@import\\s+"((?:\\.{1,2}\\/|${block.baseBlockName})[^"]*)"`, 'gm'),
		(str, path) => `//#include ${path}`
	));

	return tmp;
};
