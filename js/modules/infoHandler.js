function infoHandler (sb) {

	var seconds_per_year = 31556925.9936

	var info_gas = document.getElementsByClassName("info-gas");
	var info_density = document.getElementById("info-density");
	var info_source = document.getElementById("info-source");

	var info_heading = document.getElementById("heading");
	var info_subheading = document.getElementById("subheading");

	var info_rate_mass = document.getElementById("info-rate-mass");
	var info_rate_volume = document.getElementById("info-rate-volume");
	var info_annual_mass = document.getElementById("info-annual-mass");
	var info_annual_volume = document.getElementById("info-annual-volume");
	var info_sphere_mass = document.getElementById("info-sphere-mass");
	var info_sphere_volume = document.getElementById("info-sphere-volume");
	var info_sphere_radius = document.getElementById("info-sphere-radius");
	
	var share_link = document.getElementById("share-link");

	function INIT () {
		sb.listen({
			listenFor: ["queries-complete"],
			moduleID: this.moduleID,
			moduleFunction: "appendInfo"
		})
	}

	function APPENDINFO () {

		/*
		Updates displayed information to reflect the visualised rate
		*/

		/*
		Inserts the name of the visualised gas into every .info-gas element
		*/
		
		var i;
		var l = info_gas.length;
		for (i=0; i<l; i++) {
			info_gas[i].innerHTML = sb.rate.get_gas().name;
		}

		info_density.innerHTML = sb.rate.get_gas().kg_m3;

		if (index.gas_lookup[sb.rate.get_gas().name].source) {
			info_source.href = index.gas_lookup[sb.rate.get_gas().name].source;
			info_source.innerHTML = "source";
		}

		info_heading.innerHTML = sb.headings.main;
		info_subheading.innerHTML = sb.headings.sub;

		info_rate_mass.innerHTML = utility.converter.mass(sb.rate.get_rate().kg_s, 2);
		info_rate_volume.innerHTML = utility.converter.volume(sb.rate.get_rate().m3_s, 2);

		info_annual_mass.innerHTML = utility.converter.mass(sb.rate.get_rate().kg_s*seconds_per_year, 2);
		info_annual_volume.innerHTML = utility.converter.volume(sb.rate.get_rate().m3_s*seconds_per_year, 2);

		info_sphere_mass.innerHTML = utility.converter.mass(sb.rate.get_sphere().kg, 2);
		info_sphere_volume.innerHTML = utility.converter.volume(sb.rate.get_sphere().m3, 2);
		info_sphere_radius.innerHTML = utility.converter.length(sb.rate.get_sphere().r_m, 2);
	
		share_link.value = window.location.href
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		info_gas, info_heading, info_subheading, info_rate_mass, info_rate_volume, info_sphere_mass, info_sphere_volume, info_sphere_radius, share_link = null; 
	}

	return {
        init : INIT,
        appendInfo: APPENDINFO,
        destroy : DESTROY
    };
}