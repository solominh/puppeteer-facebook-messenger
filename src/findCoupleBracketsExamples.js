const XRegExp = require('xregexp');

var str = '[A this is a song [D] [Am] i am [Adim] Am [f] [Dmin]]';
var result = XRegExp.matchRecursive(str, '\\[', '\\]', 'g');
console.log(result);
// [ 'A this is a song [D] [Am] i am [Adim] Am [f] [Dmin]' ]

var str2 = '[First[text]][Second[text]][Third[text]]';
var result2 = XRegExp.matchRecursive(str2, '\\[', '\\]', 'g');
console.log(result2);
// [ 'First[text]', 'Second[text]', 'Third[text]' ]
