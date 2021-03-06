var defaultScaleValue = 0.5;
//var video;
var previousRotationValue = [];
var previousScaleValue = [];
var tempFlag = false;
var oneFingerGestureAllowed = false;

AR.context.on2FingerGestureStarted = function() {
    oneFingerGestureAllowed = false;
};

var World = {
    paths: [
        "assets/christmas_hat.png",
        "assets/police_hat.png",
        "assets/inspire.png",
        "assets/patent.png",
        "assets/hackathon.png",
        "assets/hackathon.png",
        "assets/csr.png",
        "assets/beard_03.png",
        "assets/mirror_sunglasses.png"
    ],
    imageTrackables: [],
    overlays: [],
    appearingAnimations: [],
    targetAcquired: false,

    init: function initFn() {
        this.createOverlays();
    },

    createOverlays: function createOverlaysFn() {
        /*
            First a AR.TargetCollectionResource is created with the path to the Wikitude Target Collection(.wtc) file.
            This .wtc file can be created from images using the Wikitude Studio. More information on how to create them
            can be found in the documentation in the TargetManagement section.
            Each target in the target collection is identified by its target name. By using this
            target name, it is possible to create an AR.ImageTrackable for every target in the target collection.
         */
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/kelly_tracker.wtc", {
            onError: World.onError
        });

        /*
            This resource is then used as parameter to create an AR.ImageTracker. Optional parameters are passed as
            object in the last argument. In this case a callback function for the onTargetsLoaded trigger is set. Once
            the tracker loaded all of its target images this callback function is invoked. We also set the callback
            function for the onError trigger which provides a sting containing a description of the error.
         */
        this.tracker = new AR.ImageTracker(this.targetCollectionResource, {
            onTargetsLoaded: World.showInfoBar,
            onError: World.onError
        });
        //video = new AR.VideoDrawable("assets/hemal.mp4", 0.9, {
        //    translate: {
        //        x: -0.5,
        //        y: 0.0
        //    },
        //    isTransparent: true,
        //    onError: World.onError
        //});
        //video.play(-1);
        //video.pause();

        //this.trackable = new AR.ImageTrackable(this.tracker, "*", {
        //    drawables: {
        //        cam: [video]
        //    },
        //    onImageRecognized: function onImageRecognizedFn() {
        //        video.resume();
        //        World.showInfoBar();
        //    },
        //    onImageLost: function onImageLostFn() {
        //        video.pause();
        //        World.hideInfoBar();
        //    },
        //    onError: World.onError
        //});

        World.initPositionValues();
        for (var i = 0; i < this.paths.length; i++) {
            World.createOverlayWithIndex(i);
        }

        World.setupAppearingAnimations();
    },

    /* Sets up the initial positions of every draggable. */
    initPositionValues: function() {
        var numberOfOverlays = this.paths.length;

        previousRotationValue = World.fillArray(0.0, numberOfOverlays);
        previousScaleValue = World.fillArray(defaultScaleValue, numberOfOverlays);
    },

    /* Returns an array with "len" occurrences of "value" */
    fillArray: function(value, len) {
        var arr = [];
        for (var i = 0; i < len; i++) {
            arr.push(value);
        }
        return arr;
    },

    /*
        Creates a new draggable AR.ImageDrawable and AR.ImageTrackable.
        The AR.ImageDrawable performs all the changes in rotation, scale and position, while we use the
        AR.ImageTrackable to switch the visibility on and off. initially all the images are switched
        off, so we set enabled to false.
    */
    createOverlayWithIndex: function(index) {
        var imageResource = new AR.ImageResource(this.paths[index], {
            onError: World.onError
        });

        var overlay = new AR.ImageDrawable(imageResource, 1, {
            scale: {
                x: defaultScaleValue,
                y: defaultScaleValue
            },
            onDragBegan: function( /*x, y*/ ) {
                oneFingerGestureAllowed = true;

                return true;
            },
            onDragChanged: function(x, y, intersectionX, intersectionY) {
                if (oneFingerGestureAllowed) {
                    this.translate = {
                        x: intersectionX,
                        y: intersectionY
                    };
                }

                return true;
            },
            onDragEnded: function( /*x, y*/ ) {
                return true;
            },
            onRotationBegan: function( /*angleInDegrees*/ ) {
                return true;
            },
            onRotationChanged: function(angleInDegrees) {
                this.rotate.z = previousRotationValue[index] + angleInDegrees;

                return true;
            },
            onRotationEnded: function( /*angleInDegrees*/ ) {
                previousRotationValue[index] = this.rotate.z;

                return true;
            },
            onScaleBegan: function( /*scale*/ ) {
                return true;
            },
            onScaleChanged: function(scale) {
                var scaleValue = previousScaleValue[index] * scale;
                this.scale = {
                    x: scaleValue,
                    y: scaleValue
                };

                return true;
            },
            onScaleEnded: function( /*scale*/ ) {
                previousScaleValue[index] = this.scale.x;

                return true;
            }
        });

        this.overlays.push(overlay);

        var imageTrackable = new AR.ImageTrackable(this.tracker, "*", {
            drawables: {
                cam: [overlay]
            },
            onImageRecognized: World.imageRecognized,
            onImageLost: World.imageLost,
            onError: World.onError
        });
        imageTrackable.enabled = false;

        this.imageTrackables.push(imageTrackable);
    },

    imageRecognized: function () {
        //video.resume();
        document.getElementById("patent").style.display = "none";
        document.getElementById("hack").style.display = "none";
        if (!tempFlag) {
            World.speakAudio();
            tempFlag = true;
        }
        if (!World.targetAcquired) {
            World.targetAcquired = true;
            document.getElementById("overlayPicker").className = "overlayPicker";

            World.hideInfoBar();
        }
    },
    resetCamButton: function resetCamButtonFn() {
        document.getElementById("camera").style.display = "block";
        document.getElementById("sharing").style.display = "block";

    },
    sendDataFromXam: function sendDataFromXamFn(name) {
        //alert(name);
        var LocalBanda = "";
        var FunFact = "";
        switch (name) {
            case "74aa5027-ba7b-4141-892a-71fe71f79ee5": LocalBanda = "  Shubham Gupta - SE 2";
                FunFact = "Fun Fact: Loves to watch cartoon in midnight!!";
                break;
            case "cfbce091-3809-4862-9664-f1e6ab2b0778": LocalBanda = "  Rohan Sharma - SE 2";
                FunFact = "Fun Fact: Can chug liquor, Eat.FIT Promoter...";
                break;
            case "b9651132-83ff-44e8-923c-ded8b528f4b1": LocalBanda = "  Anushka Bose - Consultant";
                FunFact = "Fun Fact: Mad about HUGO...";
                break;
            case "d01e544a-36c5-4fc6-b7d7-f918f9cc4635": LocalBanda = "  Sheenam Ohrie - VP";
                FunFact = "Fun Fact: NOT FOUND!";
                break;
            case "9114135d-da83-4c3f-9618-a42acf8a3fe0": LocalBanda = "  Sita T - Director";
                FunFact = "Fun Fact: A Shopaholic! ";
                break;
            default: LocalBanda = "unknown";
        }
        if (World.banda !== LocalBanda) {
            World.banda = LocalBanda;
            document.getElementById("username").innerHTML = LocalBanda;
            document.getElementById("funfact").innerHTML = FunFact;
            World.hideInfoBar();
        }
    },

    imageLost: function () {
        tempFlag = false;
        //video.pause();
        if (World.targetAcquired) {
            World.showInfoBar();
            World.targetAcquired = false;
            document.getElementById("overlayPicker").className = "overlayPickerInactive";
            document.getElementById("inspire").style.display = "none";
            document.getElementById("patent").style.display = "none";
            document.getElementById("hack").style.display = "none";
            document.getElementById("csr").style.display = "none";
            document.getElementById("beardo").style.display = "none";
            document.getElementById("glasses").style.display = "none";
            document.getElementById("reset").style.display = "none";
            document.getElementById("emptyspace").style.display = "block";

        }
    },

    setupAppearingAnimations: function() {
        for (var i = 0; i < this.overlays.length; i++) {
            this.appearingAnimations[i] = World.createAppearingAnimation(this.overlays[i], defaultScaleValue);
        }
    },

    createAppearingAnimation: function createAppearingAnimationFn(overlay, scale) {
        /*
            The animation scales up the overlay once the target is inside the field of vision. Creating an animation on
            a single property of an object is done using an AR.PropertyAnimation. Since the overlays only need to be
            scaled up on two axis, two animations are needed. These animations are grouped together utilizing an
            AR.AnimationGroup that allows them to play them in parallel.

            Each AR.PropertyAnimation targets one of the two axis and scales the model from 0 to the value passed in
            the scale variable. An easing curve is used to create a more dynamic effect of the animation.
        */
        var sx = new AR.PropertyAnimation(overlay, "scale.x", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });
        var sy = new AR.PropertyAnimation(overlay, "scale.y", 0, scale, 1500, {
            type: AR.CONST.EASING_CURVE_TYPE.EASE_OUT_ELASTIC
        });

        return new AR.AnimationGroup(AR.CONST.ANIMATION_GROUP_TYPE.PARALLEL, [sx, sy]);
    },

    /* Makes an overlay visible by enabling its AR.ImageTrackable. */
    showOverlay: function(index) {
        //if (World.targetAcquired) {
            if (!this.imageTrackables[index].enabled) {
                this.imageTrackables[index].enabled = true;

                this.appearingAnimations[index].start();
            }
        //}
    },

    /* Resets all overlays to their initial values and disables their AR.ImageTrackables so they become invisible. */
    clearOverlays: function() {

        //if (World.targetAcquired) {
            for (var i = 0; i < this.overlays.length; i++) {
                World.resetOverlayWithIndex(i);
            }
            for (var u = 0; u < this.imageTrackables.length; u++) {
                this.imageTrackables[u].enabled = false;
            }
            World.initPositionValues();
        //}
    },

    /* Resets the parameters of an overlay to its initial values. */
    resetOverlayWithIndex: function(index) {
        var overlay = this.overlays[index];
        overlay.translate.x = 0.0;
        overlay.translate.y = 0.0;
        overlay.rotate.z = 0.0;
        overlay.scale.x = defaultScaleValue;
        overlay.scale.y = defaultScaleValue;
    },

    /* Takes a screenshot. */
    captureScreen: function captureScreenFn() {
        //if (World.targetAcquired) {
            AR.platform.sendJSONObject({
                action: "capture_screen"
            });
        //}
    },
    shareScreen: function shareScreenFn() {
        document.getElementById("camera").style.display = "none";
        document.getElementById("sharing").style.display = "none";
        AR.platform.sendJSONObject({
            action: "share_screen"
        });
    },
    speakAudio: function speakAudioFn() {
        AR.platform.sendJSONObject({
            action: "speak_screen"
        });
    },
    showRecogs: function showRecogsFn() {
        $("#poi-detail-title").html("Title");
        $("#poi-detail-description").html("description");
        $("#poi-detail-distance").html("Some Value");

        /* Show panel. */
        $("#panel-poidetail").panel("open", 123);
    },

    onError: function onErrorFn(error) {
        alert(error);
    },

    hideInfoBar: function hideInfoBarFn() {
        document.getElementById("infoBox").style.display = "block";
        document.getElementById("footer").style.display = "block";

        document.getElementById("inspire").style.display = "block";
        document.getElementById("patent").style.display = "block";
        document.getElementById("hack").style.display = "block";
        document.getElementById("csr").style.display = "block";

        document.getElementById("beardo").style.display = "block";
        document.getElementById("glasses").style.display = "block";
        document.getElementById("reset").style.display = "block";
        document.getElementById("emptyspace").style.display = "none";

    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "none";
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("footer").style.display = "none";

        document.getElementById("inspire").style.display = "none";
        document.getElementById("patent").style.display = "none";
        document.getElementById("hack").style.display = "none";
        document.getElementById("csr").style.display = "none";

        document.getElementById("beardo").style.display = "none";
        document.getElementById("glasses").style.display = "none";
        document.getElementById("reset").style.display = "none";
        document.getElementById("emptyspace").style.display = "block";
    }
};

World.init();