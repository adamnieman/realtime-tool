function resizeHandler (sb) {
	var timeout;
	function INIT () {
		
		var container = document.getElementById("vis");
		sb.addEvent(window, "resize", function () {
			//Make this happen 1/2 second after person stops resizing to save on constantly running resize code
			
			clearTimeout(timeout);
			timeout = setTimeout(function () {
				
				sb.w = container.offsetWidth;
				sb.h = container.offsetHeight;

				resize ();
			}, 300)
		})
	}

	function resize () {
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