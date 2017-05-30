function queryHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["setup-complete"],
			moduleID: this.moduleID,
			moduleFunction: "getInput"
		})
	}

	function GETINPUT () {

		/*
		Checks the url query string for "gas" and "rate" input. Uses default if none found.
		Rate is received in kg/s.
		*/

		var heading_limit = 80;
		var subheading_limit = 300;

		var rate_kg_s = utility.getQueryStringValue("rate");
		var gas = utility.getQueryStringValue("gas");

		debug.sentinel(rate_kg_s, "Not able to get an input 'rate' value - a default will be used.")
		debug.sentinel(gas, "Not able to get an input 'gas' value - a default will be used.")

		/*
		Uses rate and gas values to instantiate index.Rate object and assign it to the sandbox.
		*/

		sb.rate = new index.Rate (rate_kg_s, gas);

		/*
		Checks the url query string for "heading" and "subheading" input, and trims them if they exceed the character limits.
		Assigns them to the sandbox.
		*/

		var heading = utility.getQueryStringValue("heading");
		var subheading = utility.getQueryStringValue("subheading");

		if (heading && debug.sentinel(heading.length <= heading_limit, "Heading text exceeds "+heading_limit+" character limit and will be trimmed.")) {
			heading = heading.substring(0, heading_limit);
		}

		if (subheading && debug.sentinel(subheading.length <= subheading_limit, "Heading text exceeds "+subheading_limit+" character limit and will be trimmed.")) {
			subheading = subheading.substring(0, subheading_limit);
		}

		if (heading) {
			sb.headings.main = heading;
		}

		if (subheading) {
			sb.headings.sub = subheading;
		}

		sb.notify({
			type : "queries-complete",
			data: null
		});
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
	}

	return {
        init : INIT,
        getInput: GETINPUT,
        destroy : DESTROY
    };
}