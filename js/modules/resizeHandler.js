function resizeHandler (sb) {
	var timeout;
	function INIT () {
		
		var container = document.getElementById("vis");
		sb.addEvent(window, "resize", function () {

			/*
			This code runs every time the window is resized.
			The timeout means that if window is being continuously resized, nothing will happen until it stops.
			*/

			clearTimeout(timeout);
			timeout = setTimeout(function () {

				/*
				When window has stopped being resized, update the width and height properties as stored by the 
				sandbox and fire all resize functions stored in sb.resize[].
				*/
				
				sb.w = container.offsetWidth;
				sb.h = container.offsetHeight;

				resize ();
			}, 300)
		})
	}

	function resize () {

		/*
		Calling all resize functions stored in sb.resize[]
		*/

		var i;
		var l = sb.resize.length;
		for (i=0; i<l; i++) {
			sb.resize[i]()
		}
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		clearTimeout(timeout);
		timeout, resize = null;

	}

	return {
        init : INIT,
        destroy : DESTROY
    };
}