var index = {

}

index.gas_lookup;


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

		if (debug.sentinel(index.gas_lookup.hasOwnProperty(_gas), "No available density for '"+_gas+"'. Default gas 'carbon dioxide' will be used instead.")) {
			alert ("No available density for '"+_gas+"'. Default gas 'carbon dioxide' will be used instead.");
			_gas = "carbon dioxide";
		}

		gas.name = _gas;
		gas.kg_m3 = index.gas_lookup[gas.name].density;

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

