function queryHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["setup-complete"],
			moduleID: this.moduleID,
			moduleFunction: "getInput"
		})
	}

	function GETINPUT () {

		var heading_limit = 80;
		var subheading_limit = 300;


		var rate_kg_s = utility.getQueryStringValue("rate");
		var gas = utility.getQueryStringValue("gas");

		debug.sentinel(rate_kg_s, "Not able to get an input 'rate' value - a default will be used.")
		debug.sentinel(gas, "Not able to get an input 'gas' value - a default will be used.")

		sb.rate = new index.Rate (rate_kg_s, gas);

		var heading = utility.getQueryStringValue("heading");
		var subheading = utility.getQueryStringValue("subheading");

		console.log(subheading);

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