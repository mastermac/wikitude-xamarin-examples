var defaultScaleValue = 0.5;
var video;
var previousRotationValue = [];
var previousScaleValue = [];

var oneFingerGestureAllowed = false;

AR.context.on2FingerGestureStarted = function () {
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
        "assets/csr.png"
    ],
    imageTrackables: [],
    overlays: [],
    appearingAnimations: [],
    targetAcquired: false,

    loaded: false,


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
        this.targetCollectionResource = new AR.TargetCollectionResource("assets/tracker.wtc", {
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

        /* Create play button which is used for starting the video. */
        var playButtonImg = new AR.ImageResource("assets/playButton.png", {
            onError: World.onError
        });
        var playButton = new AR.ImageDrawable(playButtonImg, 0.3, {
            enabled: false,
            clicked: false,
            //zOrder: 999,
            onClick: function playButtonClicked() {
                console.log("CLICKED");
                World.video.play(1);
                World.video.playing = true;
                playButton.clicked = true;
            },
            translate: {
                x: -0.8,
                y: -0.2
            }
        });

        /*
            Besides images, text and HTML content you are able to display videos in augmented reality. With the
            help of AR.VideoDrawables you can add a video on top of any image, object or instant recognition target
            (AR.ImageTrackable, AR.ObjectTrackable or AR.InstantTrackable) or have it displayed at any geo location
            (AR.GeoObject).
            Like any other drawable you can position, scale, rotate and change the opacity of the video drawable.

            The video we use for this example is "video.mp4". As with all resources the video can be loaded locally
            from the application bundle or remotely from any server. In this example the video file is already
            bundled with the application.

            The URL and the size are required when creating a new AR.VideoDrawable. Optionally translate, rotate and
            scale can be  set to position the video on the target.

            The class AR.VideoDrawable offers functions and triggers to control playback of the video and get
            notified of playback states. The following implementation makes use of the triggers and states to
            display an image of a play button on top of the target. Once the user clicks the play button the video
            starts to play. Additionally the video will be paused/resumed whenever the target is lost so the user
            does not miss any video content when looking away.

            Once the user clicks the button the video is played once: video.play(1). Starting the playback fires
            the onPlaybackStarted trigger and hides the playButton. When playback finishes the onFinishedPlaying
            trigger is called that shows the playButton again.

            To give the user the possibility to pause the video the AR.VideoDrawable's click trigger is used. If
            the video is playing and the user is clicking the function pause() is called which then pauses
            playback. Clicking the video again resumes playback.
        */
        this.video = new AR.VideoDrawable("assets/hemal.mp4", 1, {
            translate: {
                x: - 0.7,
                y: 0.5
            },
            //zOrder: 99,
            isTransparent: true,
            onLoaded: function videoLoaded() {
                playButton.enabled = true;
            },
            onPlaybackStarted: function videoPlaying() {
                playButton.enabled = false;
                World.video.enabled = true;
            },
            onFinishedPlaying: function videoFinished() {
                playButton.enabled = true;
                World.video.playing = false;
                World.video.enabled = false;
            },
            onClick: function videoClicked() {
                if (playButton.clicked) {
                    playButton.clicked = false;
                } else if (World.video.playing) {
                    //playButton.enabled = true;
                    World.video.pause();
                    World.video.playing = false;
                } else {
                    //playButton.enabled = false;
                    World.video.resume();
                    World.video.playing = true;
                }
            },
            onError: World.onError
        });

        /*
            Adding the video to the image target is straight forward and similar like adding any other drawable to
            an image target.

            This time we don't pause/resume the video when target is lost/recognized but instead snap the video to
            the screen so that the user can still watch it even when the target image is not visible for the
            camera. To Do so we set the 'snapToScreen.enabledOnExitFieldOfVision' property to true which indicates
            that the snapping should occur when the onImageLost event occurs. Setting the 'snapToScreen.enabled'
            property to true in the onImageLost trigger will not work because the target is already lost then and
            snap to screen can only activated for AR.ImageTrackable that are currently in the onImageRecognized state.
            When the onImageRecognized event occurs we set 'snapToScreen.enabled' to false which will unsnap the
            drawables from the cam and augmentation will stick on the target again.

            Of course the video will continue playing back in the meantime so that the user can watch the entire
            video without any interruption.
        */
        this.pageOne = new AR.ImageTrackable(this.tracker, "*", {
            drawables: {
                cam: [World.video, playButton]
            },
            onImageRecognized: function onImageRecognizedFn() {
                World.pageOne.snapToScreen.enabled = false;
                World.imageLost();
            },
            snapToScreen: {
                enabledOnExitFieldOfVision: true,
                snapContainer: document.getElementById('snapContainer')
            },
            onError: World.onError
        });

        World.initPositionValues();
        for (var i = 0; i < this.paths.length; i++) {
            World.createOverlayWithIndex(i);
        }

        World.setupAppearingAnimations();

    },

    /* Sets up the initial positions of every draggable. */
    initPositionValues: function () {
        var numberOfOverlays = this.paths.length;

        previousRotationValue = World.fillArray(0.0, numberOfOverlays);
        previousScaleValue = World.fillArray(defaultScaleValue, numberOfOverlays);
    },

    /* Returns an array with "len" occurrences of "value" */
    fillArray: function (value, len) {
        var arr = [];
        for (var i = 0; i < len; i++) {
            arr.push(value);
        }
        return arr;
    },
    createOverlayWithIndex: function (index) {
        var imageResource = new AR.ImageResource(this.paths[index], {
            onError: World.onError
        });

        var overlay = new AR.ImageDrawable(imageResource, 1, {
            scale: {
                x: defaultScaleValue,
                y: defaultScaleValue
            },
            onDragBegan: function ( /*x, y*/) {
                oneFingerGestureAllowed = true;

                return true;
            },
            onDragChanged: function (x, y, intersectionX, intersectionY) {
                if (oneFingerGestureAllowed) {
                    this.translate = {
                        x: intersectionX,
                        y: intersectionY
                    };
                }

                return true;
            },
            onDragEnded: function ( /*x, y*/) {
                return true;
            },
            onRotationBegan: function ( /*angleInDegrees*/) {
                return true;
            },
            onRotationChanged: function (angleInDegrees) {
                this.rotate.z = previousRotationValue[index] + angleInDegrees;

                return true;
            },
            onRotationEnded: function ( /*angleInDegrees*/) {
                previousRotationValue[index] = this.rotate.z;

                return true;
            },
            onScaleBegan: function ( /*scale*/) {
                return true;
            },
            onScaleChanged: function (scale) {
                var scaleValue = previousScaleValue[index] * scale;
                this.scale = {
                    x: scaleValue,
                    y: scaleValue
                };

                return true;
            },
            onScaleEnded: function ( /*scale*/) {
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
    setupAppearingAnimations: function () {
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
    showOverlay: function (index) {
        //if (World.targetAcquired) {
        if (!this.imageTrackables[index].enabled) {
            this.imageTrackables[index].enabled = true;

            this.appearingAnimations[index].start();
        }
        //}
    },
    clearOverlays: function () {

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
    resetOverlayWithIndex: function (index) {
        var overlay = this.overlays[index];
        overlay.translate.x = 0.0;
        overlay.translate.y = 0.0;
        overlay.rotate.z = 0.0;
        overlay.scale.x = defaultScaleValue;
        overlay.scale.y = defaultScaleValue;
    },


    imageRecognized: function () {
        //video.resume();
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
            default: LocalBanda = " User Not Registered...";
        }
        if (World.banda != LocalBanda) {
            World.banda = LocalBanda;
            document.getElementById("username").innerHTML = LocalBanda;
            document.getElementById("funfact").innerHTML = FunFact;
            World.hideInfoBar();
        }
    },

    imageLost: function () {
        //video.pause();
        if (World.targetAcquired) {
            World.showInfoBar();
            World.targetAcquired = false;
            document.getElementById("overlayPicker").className = "none";
            document.getElementById("inspire").style.display = "none";
            document.getElementById("patent").style.display = "none";
            document.getElementById("hack").style.display = "none";
            document.getElementById("csr").style.display = "none";
        }
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
    },

    showInfoBar: function worldLoadedFn() {
        document.getElementById("infoBox").style.display = "none";
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("footer").style.display = "none";

        document.getElementById("inspire").style.display = "none";
        document.getElementById("patent").style.display = "none";
        document.getElementById("hack").style.display = "none";
        document.getElementById("csr").style.display = "none";
    }

};

World.init();