var OPCODES = {
	// Col
	'LD': '011' + '000',
	'ADD': '100' + '000',
	'AND': '101' + '000',
	'ADDC': '110' + '000',
	'ANDC': '111' + '000',
	// Col
	'ST': '011' + '001',
	'SUB': '100' + '001',
	'OR': '101' + '001',
	'SUBC': '110' + '001',
	'ORC': '111' + '001',
	// Col
	'MUL': '100' + '010',
	'XOR': '101' + '010',
	'MULC': '110' + '010',
	'XORC': '111' + '010',
	// Col
	'JMP': '011' + '011',
	'DIV': '100' + '011',
	'XNOR': '101' + '011',
	'DIVC': '110' + '011',
	'XNORC': '111' + '011',
	// Col
	'BEQ': '011' + '100',
	'CMPEQ': '100' + '100',
	'SHL': '101' + '100',
	'CMPEQC': '110' + '100',
	'SHLC': '111' + '100',
	// Col
	'BNE': '011' + '101',
	'CMPLT': '100' + '101',
	'SHR': '101' + '101',
	'CMPLTC': '110' + '101',
	'SHRC': '111' + '101',
	// Col
	'CMPLE': '100' + '110',
	'SRA': '101' + '110',
	'CMPLEC': '110' + '110',
	'SRAC': '111' + '110',
	// Col
	'LDR': '011' + '111',
}

var DESCRIPTORS = {
	'OP': 'Reg[%rc] &larr; Reg[%ra] %op Reg[%rb]',
	'OPC': 'Reg[%rc] &larr; Reg[%ra] %op %sl',
	'LD': 'Reg[%rc] &larr; Mem[Reg[%ra] + %sl]',
	'ST': 'Mem[Reg[&Ra] + %sl] &larr; Reg[%rc]',
	'JMP': 'Reg[%rc] &larr; PC + 4; PC &larr; Reg[%ra]',
	'BEQ': 'Reg[%rc] &larr; PC + 4; if Reg[%ra] = 0 then PC &larr; PC + 4 + 4 * %sl',
	'BNE': 'Reg[%rc] &larr; PC + 4; if Reg[%ra] &neq; 0 then PC &larr; PC + 4 + 4 * %sl',
	'LDR': 'Reg[%rc] &larr; Mem[PC + 4 + 4 * %sl]'
}

var OPERATORS = {
	'ADD': '+',
	'SUB': '-',
	'MUL': '*',
	'DIV': '/',
	'CMPEQ': '==',
	'CMPLT': '<',
	'CMPLE': '<=',
	'XOR': 'XOR',
	'XNOR': 'XNOR',
	'AND': 'AND',
	'OR': 'OR',
	'SHL': '<<',
	'SHR': '>>',
	'SRA': '>>>'
}

$(function() {
	$("#opcode-type-select").change(function() {
		$('#tool').removeClass('type-i').removeClass('type-ii').addClass($(this).val());
	});

	$('#input-base-select').change(updateFromFields);

	$('#input-value').each(function() {
		var $this = $(this);
		var oldValue = '';

		$this.focus(function() {
			oldValue = $this.val();
		});

		$this.keydown(function() {
			oldValue = $this.val();
		});

		$this.keyup(function() {
			var val = $this.val();
			if(val == oldValue) {
				return;
			}
			if(val.slice(0,2) == '0x') {
				val = val.slice(2);
				$this.val(val);
				setInputBase('16');
			}
			if(val.slice(0,1) == '#') {
				val = val.slice(1);
				$this.val(val);
				setInputBase('16');
			}
			if(val.slice(0,2) == '0b') {
				val = val.slice(2);
				$this.val(val);
				setInputBase('2');
			}
			if(isBinaryNumber(val) && val.length >= 8) {
				setInputBase('2');
			}
			if(!isBinaryNumber(val) && isHexNumber(val)) {
				setInputBase('16');
			}
			if(val.length > parseInt($this.attr('maxlength')) || (!isBinaryNumber(val) && !isHexNumber(val))) {
				$this.val(oldValue);
			} else {
				oldValue = val;
				updateFromFields();
			}
		});
	});

	$('#hex-out').click(function() {
		var $this = $(this);
		var html = $this.html();
		if(ClipboardEvent && false) {
			var copyEvent = new ClipboardEvent('copy', {
				dataType: 'text/plain',
				data: $this.html()
			});
			document.dispatchEvent(copyEvent);
			$this.html('Copied!');
			setTimeout(function() {
				$this.html(html);
			},1000);
		}
	});

	$('.opcode-val').click(updatePrompter(
		'Enter a valid opcode name',
		function(n) { return OPCODES[n]; },
		function(n) { return OPCODES[n]; },
		26,
		31
	));


	$('.rc-val').click(updatePrompter(
		'Choose a register (0 to 31)',
		function(n) { n = parseInt(n); return n >=0 && n <= 31; },
		function(n) { return padZeros(decToBin(n),5); },
		21,
		25
	));

	$('.ra-val').click(updatePrompter(
		'Choose a register (0 to 31)',
		function(n) { n = parseInt(n); return n >=0 && n <= 31; },
		function(n) { return padZeros(decToBin(n),5); },
		16,
		20
	));

	$('.rb-val').click(updatePrompter(
		'Choose a register (0 to 31)',
		function(n) { n = parseInt(n); return n >=0 && n <= 31; },
		function(n) { return padZeros(decToBin(n),5); },
		11,
		15
	));

	$('.literal-hex').click(updatePrompter(
		'Enter a four-digit hex value',
		function(n) { return isHexNumber(n,4); },
		function(n) { return padZeros(hexToBin(n),5); },
		0,
		15
	));

	$('.literal-dec').click(updatePrompter(
		'Enter a 16-bit decimal value (-32768 to 32767)',
		function(n) { n = parseInt(n); return n >= -32768 && n <= 32767; },
		function(n) { return sixteenBitTwosComplementDecToBin(n); },
		0,
		15
	));


	$('.digit').each(function() {

		var value = '';
		var $this = $(this);

		function nextDigit(me,by) {
			by = by || 1;
			var digits = $('.digit');
			var index = digits.index(me) + by;
			if(index < digits.length && index >= 0) {
				return digits[index];
			}
		}

		$this.focus(function() {
			value = $this.val();
			$this.val('');
		});


		$this.blur(function() {
			if(!$this.val().length) {
				$this.val(value);
			}
		});

		$this.keydown(function(e) {
			if(e.keyCode == 8 && !$this.val().length) {
				var pd = nextDigit(this,-1);
				if(pd) pd.focus();
			}
			return [8,9,13,48,49].indexOf(e.keyCode) >= 0;
		});

		$this.keyup(function(e) {
			if($this.val().length) {
				var nd = nextDigit(this);
				updateFromDigits();
				if(nd) nd.focus();
			}
		});

	});
});

function padZeros(n,k) {
	k = k || 32;
	var h = '0'
	while(n.length < k) {
		n = h + n;
	}
	return n;
}

function signExtend(n,k) {
	k = k || 32;
	var h = n.charAt(0);
	while(n.length < k) {
		n = h + n;
	}
	return n;
}

function twosComplementBinToDec(n) {
	var lead = parseInt(n.charAt(0));
	n = parseInt(signExtend(n),2);
	if(lead) {
		n = - (~ n + 1);
	}
	return n;
}

function twosComplementDecToBin(n) {
	return (n >>> 0).toString(2);
}

function sixteenBitTwosComplementDecToBin(n) {
	return padZeros(twosComplementDecToBin(n),32).slice(16)
}

function decToBin(n) {
	return parseInt(n).toString(2);
}

function hexToBin(n) {
	return parseInt(n,16).toString(2);
}

function isBinaryNumber(str) {
	if(str.slice(0,2) == '0b') {
		str = str.slice(2);
	}
	return str.split('').filter(function(d) {
		return d != '1' && d != '0';
	}).length == 0;
}

function isHexNumber(str,n) {
	n = n || Infinity;
	str = str.toLowerCase();
	if(str.slice(0,2) == '0x') {
		str = str.slice(2);
	}
	if(str.slice(0,1) == '#') {
		str = str.slice(1);
	}
	return str.split('').filter(function(d) {
		return '0123456789abcdef'.indexOf(d) == -1;
	}).length == 0 && str.length <= n;
}

function setInputBase(n) {
	$('#input-base-select').val(n);
	updateFromFields();
}

function updateFromFields() {
	var val = $('#input-value').val();
	var base = parseInt($('#input-base-select').val());
	if(base == 16) {
		$('#input-value').attr('maxlength',8);
	} else {
		$('#input-value').attr('maxlength',32);
	}
	update(parseInt(val,base));
}

function setDigitsFromBinaryString(n) {
	n = n.split('');
	var offset = 32 - n.length;
	var digits = $('.digit');
	digits.each(function(i,e) {
		$(this).val(n[i - offset] || '0');
	});
}

function getDigits() {
	return $('.digit').map(function() {
		return $(this).val();
	}).toArray().join('');
}

function updateFromDigits() {
	update(getDigits(),2);
}

function update(val) {
	if(isNaN(val)) {
		val = 0;
	}
	var bin = val.toString(2);
	while(bin.length < 32) {
		bin = '0' + bin;
	}
	var opcodeType = bin.slice(0,2);
	if(opcodeType == '10') {
		$('#opcode-type-select').val('type-i').attr('disabled','disabled');
	} else if(opcodeType == '01' || opcodeType == '11') {
		$('#opcode-type-select').val('type-ii').attr('disabled','disabled');
	} else {
		$('#opcode-type-select').attr('disabled',null);
	}
	$('#opcode-type-select').change();
	setDigitsFromBinaryString(bin);
	for(var i=0;i<8;i++) {
		var r = 4 * i,
			sub = bin.slice(r,r + 4),
			res = parseInt(sub,2);
		$($('.hex-digit').get(i)).html(res.toString(16).toUpperCase());
	}
	var op = bin.slice(0,6),
		rc = bin.slice(6,11),
		ra = bin.slice(11,16),
		rb = bin.slice(16,21),
		lit = bin.slice(16);
	updateOpcode(op)
	updateRc(rc);
	updateRa(ra);
	updateRb(rb);
	updateLiteral(lit);
	updateResult(op,rc,ra,rb,lit);
	$('#hex-out').html(parseInt(bin,2).toString(16));
}

function updateOpcode(n) {
	$('.opcode-hex').html(parseInt(n,2).toString(16).toUpperCase());
	$('.opcode-val').html(lookupOpcode(n) || '???');
}

function updateRc(n) {
	$('.rc-hex').html(parseInt(n,2).toString(16).toUpperCase());
	$('.rc-val').html(parseInt(n,2).toString(10));
}

function updateRa(n) {
	$('.ra-hex').html(parseInt(n,2).toString(16).toUpperCase());
	$('.ra-val').html(parseInt(n,2).toString(10));
}

function updateRb(n) {
	$('.rb-hex').html(parseInt(n,2).toString(16).toUpperCase());
	$('.rb-val').html(parseInt(n,2).toString(10));
}

function updateLiteral(n) {
	$('.literal-hex').html(parseInt(n,2).toString(16).toUpperCase());
	$('.literal-dec').html(twosComplementBinToDec(n).toString().toUpperCase());
}

function lookupOpcode(n) {
	for(var key in OPCODES) {
		if(OPCODES[key] == n) {
			return key;
		}
	}
}

function updateResult(op,rc,ra,rb,lit) {
	var opName = lookupOpcode(op),
		res,
		desc,
		op;
	if(!opName) {
		res = 'ILLOP: Couldn\'t find a matching opcode.';
	} else {
		if(op.slice(0,2) == '10') {
			desc = DESCRIPTORS['OP'];
			op = OPERATORS[opName];
		} else if(op.slice(0,2) == '11') {
			desc = DESCRIPTORS['OPC'];
			op = OPERATORS[opName.slice(0,-1)];
		} else {
			desc = DESCRIPTORS[opName];
		}
		desc = desc.replace('%rc','<span class="rc">' + parseInt(rc,2).toString(10) + '</span>');
		desc = desc.replace('%ra','<span class="ra">' + parseInt(ra,2).toString(10) + '</span>');
		desc = desc.replace('%rb','<span class="rb">' + parseInt(rb,2).toString(10) + '</span>');
		desc = desc.replace('%op',op);
		desc = desc.replace('%sl','<span class="literal" title="0x' + parseInt(ra,2).toString(16) + '">' + twosComplementBinToDec(lit) + '</span>');
		res = desc;
	}
	$('#result').html(res);
}

function promptToUpdate(text,condition,filter,rangeStart,rangeEnd) {
	var ok = false;
	while(!ok) {
		var res = prompt(text);
		if(!res) {
			return;
		} else {
			if(condition(res)) {
				ok = true;
				res = filter(res);
				var currentDigits = getDigits();
				update(currentDigits.slice(0,31 - rangeEnd) + res + currentDigits.slice(31 - rangeStart + 1));
			}
		}
	}
}

function updatePrompter(text,condition,filter,rangeStart,rangeEnd) {
	return function() {
		promptToUpdate(text,condition,filter,rangeStart,rangeEnd);
	}
};
