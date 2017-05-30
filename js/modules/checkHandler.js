function checkHandler (sb) {

	function INIT () {
		sb.listen({
			listenFor: ["ready"],
			moduleID: this.moduleID,
			moduleFunction: "performChecks"
		})
	}

	function PERFORMCHECKS () {

		/*
		Checks whether browser supports WebGL and kills js execution if not.
		Continues otherwise.
		*/
		
		debug.check(!check_webgl(), "WebGL failed - visualisation cannot be generated");
		
		sb.notify({
			type : "checks-complete",
			data: null
		});

	}

	function check_webgl () {
		if (!window.WebGLRenderingContext) {
		    // the browser doesn't even know what WebGL is
		    //window.location = "http://get.webgl.org";
		    alert("This visualisation cannot be generated as your browser does not support WebGL. Visit http://get.webgl.org to find out more.")
		    return 1;
		} else {
		    var canvas = document.createElement("canvas");
		   // alert(canvas)
		    var context = canvas.getContext("webgl");
		   // alert(context)
		   	if (!context) {
		   		context = canvas.getContext("experimental-webgl");
		   		if (context) {
		   			debug.log("WebGL support is experimental.");
		   		}
		   	}

		    if (!context) {
		      // browser supports WebGL but initialization failed.
		      // window.location = "http://get.webgl.org/troubleshooting";
		      alert("This visualisation cannot be generated as WebGL has failed to initialise. Visit http://get.webgl.org to troubleshoot.")
		      return 1;
		    }
		}

		return 0;
	}
	
	function DESTROY () {
		sb.unlisten(this.moduleID)
		check_webgl = null;
	}

	return {
        init : INIT,
        performChecks: PERFORMCHECKS,
        destroy : DESTROY
    };
}