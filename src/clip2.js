'use strict';

const assert = require('assert');
const utils = require('./utils');
const chord = require('./chord');

/**
 * Get defauly params for a clip, such as root note, pattern etc
 * @return {Object}
 */
const getDefaultParams = () => ({
	notes: ['c4'],
	pattern: 'x',
	accentMap: '',
	accentHi: 127,
	accentLow: 70,
	shuffle: false,
	sizzle: false,
	arpegiate: false,
	subdiv: '4n'
});

/**
 * HDR speed is denoted by the number of ticks per note
 * By default this is set to a quarter note (4n) to be in line with Tone.js' default subdivision
 * Technically a bar is 512 ticks long. So it's HDR speed is 512
 * @type {Object}
 */
const hdr = {
	'1n': 512,
	'2n': 256,
	'4n': 128,
	'8n': 64,
	'16n': 32,
};
/*
params = {
	notes: 'c4',
	pattern: 'x[x[xx]x]x'
}
 */
const clip2 = params => {
	var clipNotes = [];
	var step = 0;

	params = Object.assign(getDefaultParams(), params || {});

	let subdivHdr = hdr[params.subdiv] || hdr['4n'];

	// If notes is a string, split it into an array
	if (typeof params.notes === 'string') {
		// Remove any accidental double spaces
		params.notes = params.notes.replace(/\s{2,}/g, ' ');
		params.notes = params.notes.split(' ');
	}

	// Convert chords if any to notes
	params.notes = params.notes.map(el => {
		assert(
			Array.isArray(el) ||
			utils.isNote(el) ||
			chord.getChord(el),
			'el must be a valid note, array of notes or a chord'
		);

		if (utils.isNote(el)) {
			return el.toUpperCase();
		}

		if (Array.isArray(el)) {
			// This could be a chord provided as an array
			// make sure it uses valid notes
			el.forEach(n => {
				assert(utils.isNote(n), 'array must comprise valid notes');
			});
			return el.join();
		}

		if (chord.getChord(el)) {
			// A note such as c6 could be a chord (sixth) or a note (c on the 6th octave)
			// This also applies to c4, c5, c6, c9, c11
			// TODO: Identify a way to avoid returning unwanted results
			return chord.getChord(el).join();
		}

		return el;
	});

	assert(typeof params.pattern === 'string', 'pattern should be a string');
	assert(/[^x\-_\[\]]/.test(params.pattern) === false, 'pattern can only comprise x - _ [ ]');

	function r(arr, length) {
		arr.forEach(el => {
			if (typeof el === 'string') {
				let note = null;
				// If the note is to be `on`, then it needs to be an array
				if (el === 'x') {
					note = Array.isArray(params.notes[step]) ? params.notes[step] : params.notes[step].split(',')
				}

				clipNotes.push({note, length, level: 127});
				step++;
				if (step === params.notes.length) {
					step = 0;
				}
			}
			if (Array.isArray(el)) {
				r(el, length/el.length)
			}
		});
	}

	r(utils.expandStr(params.pattern), subdivHdr);
	return clipNotes;
};

module.exports = clip2;