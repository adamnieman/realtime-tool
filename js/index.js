var index = {

}

index.gas_density_lookup = {
	//all densities in kg/m^3
	"carbon dioxide": 1.87,
	"methane": 0.656,
}


index.Rate = function (_rate_kg_s, _gas) {

	var gas = {
		name: null,
		kg_m3: null,
	} 

	var rate = {
		kg_s: null,
		m3_s: null,
	}

	var sphere = {
		kg: null,
		m3: null,
		r_m: null,
		per_s: null,
		s_per: null,
	}

	var construct = function (_rate_kg_s, _gas) {
		_rate_kg_s = parseFloat(_rate_kg_s);

		if (debug.sentinel(!isNaN(_rate_kg_s), "Invalid non-numerical rate value passed. Default value of 1 kg/s will be used instead.") || 
			debug.sentinel(_rate_kg_s >= 0, "Invalid negative rate value passed. Default value of 1 kg/s will be used instead.")
			) {
			alert ("Invalid, negative or non-numerical rate value passed. A default value of 1 kg/s will be used instead.");
			_rate_kg_s = 1;
		}

		if (!_gas) {
			debug.log("Using default gas 'carbon dioxide'.")
			_gas = "carbon dioxide";
		}

		if (debug.sentinel(index.gas_density_lookup.hasOwnProperty(_gas), "No available density for '"+_gas+"'. Default gas 'carbon dioxide' will be used instead.")) {
			alert ("No available density for '"+_gas+"'. Default gas 'carbon dioxide' will be used instead.");
			_gas = "carbon dioxide";
		}

		gas.name = _gas;
		gas.kg_m3 = index.gas_density_lookup[gas.name];

		rate.kg_s = _rate_kg_s;
		rate.m3_s = rate.kg_s/gas.kg_m3;

		calculate_sphere ();
	}

	var calculate_sphere = function () {

		//setup starting sphere weight, then increase it in a loop until no more than 30 spheres per second are needed.
		var sphere_kg = 0.001;
		var spheres_per_s_limit = 20

		while (rate.kg_s/sphere_kg > spheres_per_s_limit) {
			sphere_kg *= 10;
		}

		sphere.kg = sphere_kg;
		sphere.m3 = sphere.kg/gas.kg_m3;
		sphere.r_m = Math.cbrt((3*sphere.m3)/(4*Math.PI));
		sphere.per_s = rate.kg_s/sphere.kg;
		sphere.s_per = 1/sphere.per_s;
	}

	this.get_sphere = function () {
		return sphere;
	}

	this.get_rate = function () {
		return rate;
	}

	this.get_gas = function () {
		return gas;
	}

	construct(_rate_kg_s, _gas);
}


index.Bill = function (_title, _date) {
	var title;
	var date;

	var set = false;
	var votes = {
		aye: null,
		no: null,
		abstain: null,
		nonVoter: null,
		error: null,
		nonEligible: null,
		suspendedExpelled: null,
	};
	var votesTotal = null;

	//setters

	this.setVotesCount = function (_input) {
		if (debug.sentinel(typeof _input == "object", "Cannot assign votes count by passing input of type '"+typeof _input+"'.")){
			return;
		}

		for (propt in _input) {
			if (debug.sentinel(votes.hasOwnProperty(propt), "Invalid property of input: '"+propt+"'.") ||
				debug.sentinel(typeof _input[propt] == 'number', "Invalid (non-numerical) value '"+_input[propt]+"' for property '"+propt+"'.") ||
				debug.sentinel(_input[propt] >= 0, "Invalid (negative) value '"+_input[propt]+"' for property '"+propt+"'.")) {
				continue;
			}
			/*if (votesCount[propt] != null) {
				debug.log("Reassigning value of '"+propt+"' from: '"+votesCount[propt]+"' to: '"+_input[propt]+"'.")
			}*/	
			votes[propt] = {
				count: _input[propt],
				array: [],
				crowd: null,//new Array(_input[propt]).fill(null),
			}
		}

		setVotesTotal();

		if (title && date) {
			set = true;
		}

	}

	this.setVote = function (_vote) {
		if (debug.sentinel(_vote instanceof index.Vote, "Invalid vote object passed - vote must be an instance of index.Vote.")) {
			return;
		}

		votes[_vote.getResult()].array.push(_vote);
	}

	this.setCrowd = function (_result, _crowd) {
		if (debug.sentinel(votes.hasOwnProperty(_result), "Could not assign crowd to nonexistant property '"+_result+"'.") ||
			debug.sentinel(_crowd instanceof index.Crowd, "Invalid crowd object passed - crowd must be an instance of index.Crowd.") ||
			debug.sentinel(_crowd.getIsometric, "Crowd is not isometric")) {
			return;
		}

		votes[_result].crowd = _crowd;
	}

	var setVotesTotal = function () {
		for (propt in votes) {
			if (votes[propt] != null) {
				votesTotal = votesTotal || 0;
				votesTotal += votes[propt].count;
			}
		}
	}


	//getters

	this.isSet = function () {return set;}
	this.getVotesTotal = function () {return votesTotal;}
	this.getVotes = function (_result, _i) {
	
		if (_result===undefined ||
			debug.sentinel(votes.hasOwnProperty(_result), "Could not get votes belonging to nonexistant property '"+_result+"'.")) {
			return votes;
		}
		if (_i===undefined ||
			debug.sentinel(typeof _i == "number" && i >= 0 && i < votes[_result].count, "Could not get vote belonging to property '"+_result+"' of invalid index '"+_i+"'.")) {
			return votes[_result];
		}

		return votes[_result].array[_i];
	}


	

	var construct = function (_title, _date) {
		if (debug.sentinel(typeof _title == "string", "Cannot construct Bill object by passing title input of type '"+typeof _title+"'.") ||
			debug.sentinel(typeof _date == "string", "Cannot construct Bill object by passing date input of type '"+typeof _date+"'.")){
			return;
		}

		title = _title;
		date = new Date(_date);
		if (debug.sentinel(!isNaN(date.getTime()), "Could not create valid date from the string '"+_date+"'.")) {
			date = null;
		}
	}

	construct(_title, _date);
}


