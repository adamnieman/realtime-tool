//this required debug to work

var utility = {};

utility.avg = function (array) {

	var total = 0;

	var i=0;
	var l = array.length

	for (i=0; i<l; i++) {
		total += +array[i];
	}

	return total/l;
}

utility.round = function (value, dp) {
	if (debug.check(!(isNaN(value) || isNaN(dp)), "Cannot round if invalid number")) return null;
	var multiplier = Math.pow(10, dp);
	return Math.round(value*multiplier)/multiplier
}

utility.pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

utility.addClass = function (elem, cls) {
	//adds cls to elem
	if (elem.classList) {
		elem.classList.add(cls);
	}
	else {
		if (elem.className.indexOf(cls) < 0) {
			elem.className += " "+cls;
		}
	}
}

utility.removeCurrentClassInstance = function (elems, cls) {
	//loops through array of elems, removes any instances of cls
	var i;
	var l = elems.length;
	for (i = 0; i < l; i++) {
		this.removeClass(elems[i], cls)
	}
}

utility.containsClass = function (elem, cls) {
	//checks if elem contains cls, returns true if it does
	
	//console.log(elem)
	var contains = false;
	
	if (elem.classList) {
		contains = elem.classList.contains(cls);
	}
	else {
		if (elem.className && elem.className.indexOf(cls) >= 0) {
			contains = true;
		}
	}
	
	return contains;
}

utility.removeClass = function (elem, cls) {
	//removes cls from elem
	if (elem.classList) {
		elem.classList.remove(cls);
	}
	else {
		if (elem.className.indexOf(cls) >= 0) {
			elem.className = elem.className.replace(cls, "")
		}
	}
}

utility.arrayMax = function (arr, key){
    var m = -Infinity,
        cur,
        i;
    for(i=0; i<arr.length; i++){
        cur = arr[i][key]
        if(cur > m){
            m = cur;
        }
    }
    return m;
}

utility.arrayMin = function (arr, key){
    var m = Infinity,
        cur,
        i;
    for(i=0; i<arr.length; i++){
        cur = arr[i][key]
        if(cur < m){
            m = cur;
        }
    }
    return m;
}

utility.checkExpectedProperties = function (object, properties) {
	
	if(debug.sentinel(typeof(object) === "object" && typeof(object) != null, "Invalid 'object' argument of type "+typeof(object)+" - must be of type 'object'.")) {
		return;
	}
	if(debug.sentinel(properties.constructor === Array, "Invalid properties list - must be an array.")) {
		return;
	}

	var does_not_contain = [];

	var i;
	var l = properties.length;
	for (i=0; i<l; i++) {
		if (!object.hasOwnProperty(properties[i])) {
			does_not_contain.push(properties[i]);
		}
	}

	if (debug.sentinel(does_not_contain.length === 0, "Object does not contain all of the passed properties. Missing properties: "+does_not_contain.toString()+".")) {
		return false;
	}

	return true;
}

utility.getQueryStringValue = function (key) {  
  return decodeURIComponent(window.location.search.replace(new RegExp("^(?:.*[&\\?]" + encodeURIComponent(key).replace(/[\.\+\*]/g, "\\$&") + "(?:\\=([^&]*))?)?.*$", "i"), "$1"));  
} 


//hex is a hexadecimal string, flag is H, S, or L, func is a comparison function returning true or false
utility.adjustColour = function (hex, flag, min, max) {
	
	var col;

	//checks that hex is a valid hexadecimal colour string
	if (debug.sentinel("Invalid colour: "+hex+" - must be a hexadecimal string. Returning #ffffff.", /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex))) {
		return "#ffffff";
	}
	
	//checks for a valid flag, or assigns if undefined
	flag = flag || "l"
	if (debug.sentinel("Invalid flag: "+flag+" - must be a string or undefined. Returning "+hex+".", typeof(flag) === "string" ) || 
		debug.sentinel("Invalid flag: "+flag+" - must be H, S, L or undefined. Returning "+hex+".", /(^[hsl]$)/i.test(flag))) {
		return hex;
	}
	flag = flag.toLowerCase();

	//checks for a valid function, or assigns if undefined

	min = min || 0;
	max = max || 1;
	if (debug.sentinel("Invalid min value: "+min+" - must be a number greater than or equal to 0 and less than 1.", typeof(min) === "number" && min >= 0 && min < 1) ||
		debug.sentinel("Invalid max value: "+max+" - must be a number greater than 0 and less than or equal to 1.", typeof(max) === "number" && max > 0 && max <= 1) ||
		debug.sentinel("Invalid min and max values: "+min+", "+max+" - min must not exceed max.", min < max)) {
		return hex;
	}

	col = d3.hsl(hex);

	if (col[flag] < min) { col[flag] = min }
	else if (col[flag] > max) { col[flag] = max }

	return col;
}


utility.addCommas = function (nStr) {
		nStr += '';
		var x = nStr.split('.');
		var x1 = x[0];
		var x2 = x.length > 1 ? '.' + x[1] : '';
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
}

utility.converter = function () {
	function mass (v, dp) {

		dp = dp ? dp : 0;
		
		var unit;
		var value;

		if (v < 1) {
			unit = "g";
			value = v*1000;
		}
		else if (v >= 1 && v < 1000) {
			unit = "kg";
			value = v
		}
		else if (v >= 1000) {
			unit = "t";
			value = v/1000;
		}

		value = round(value, dp);
		return generateReturn (value, unit);
	}

	function length (v, dp) {

		dp = dp ? dp : 0;
		
		var unit;
		var value;

		if (v < 0.01) {
			unit = "mm";
			value = v*1000;
		}
		else if (v >= 0.01 && v < 1) {
			unit = "cm";
			value = v*100;
		}
		else if (v >= 1 && v < 1000) {
			unit = "m";
			value = v
		}
		else if (v >= 1000) {
			unit = "km";
			value = v/1000;
		}
		
		value = round(value, dp);
		return generateReturn (value, unit);
	}

	function volume (v, dp) {

		dp = dp ? dp : 0;
		
		var unit;
		var value;

		if (v < 0.1) {
			unit = "cm<sup>3</sup>";
			value = v*1000000;
		}
		else if (v >= 0.1 && v < 1000000000) {
			unit = "m<sup>3</sup>";
			value = v
		}
		else if (v >= 1000000000) {
			unit = "km<sup>3</sup>";
			value = v/1000000000;
		}

		value = round(value, dp);
		return generateReturn (value, unit);
	}

	function power (v, dp) {

		dp = dp ? dp : 0;
		
		var unit;
		var value;

		if (v < 1) {
			unit = "W";
			value = v*1000;
		}
		else if (v >= 1 && v < 1000) {
			unit = "kW";
			value = v
		}
		else if (v >= 1000 && v < 1000000000) {
			unit = "mW";
			value = v/1000;
		}
		else if (v >= 1000000000) {
			unit = "tW";
			value = v/1000000000;
		}

		value = round(value, dp);
		return generateReturn (value, unit);
	}

	function energy (v, dp) {

		dp = dp ? dp : 0;
		
		var unit;
		var value;

		if (v < 1) {
			unit = "Wh";
			value = v*1000;
		}
		else if (v >= 1 && v < 1000) {
			unit = "kWh";
			value = v
		}
		else if (v >= 1000 && v < 1000000000) {
			unit = "MWh";
			value = v/1000;
		}
		else if (v >= 1000000000) {
			unit = "TWh";
			value = v/1000000000;
		}

		value = round(value, dp);
		return generateReturn (value, unit);
	}

	function generateReturn (value, unit) {
		return utility.addCommas(value)+" "+unit;
	}

	function round (v, dp) {
		dp = dp ? dp : 0;

		var multiplier = Math.pow(10, dp);
		var value = Math.round(v*multiplier)/multiplier;

		return value;
	}

	return {
		mass: mass,
		length: length,
		volume: volume,
		power: power,
		energy: energy,
		round: round,
	}
} ()

utility.isValidHex = function (colour) {
	var result  = /^#[0-9A-F]{6}$/i.test(colour)
	return result;
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
	     for (var i = (start || 0), j = this.length; i < j; i++) {
	         if (this[i] === obj) { return i; }
	     }
	     return -1;
	}
}

if (!Math.cbrt) {
  Math.cbrt = function(x) {
    var y = Math.pow(Math.abs(x), 1/3);
    return x < 0 ? -y : y;
  };
}