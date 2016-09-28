// ************************************************************************************************************
// Written by Alexander Agudelo <alex.agudelo@asurantech.com>, 2016
// Date: 12/Jul/2016
// Description: Displays a 3D objec that rotates depending on the input values given
//
// ------
// Copyright (C) Asuran Technologies - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential.
// ************************************************************************************************************

define(['RIB', 'PropertiesPanel', 'utils'], function(RIB, Ppanel, utils){
  var Viewer3D = {};

  /**
   * This method is called by the
   * base class to determine the
   * type inputs required for this
   * Widget to work.
   */
  Viewer3D.getInputs = function(){
    return ['Pitch', 'Roll', 'Yaw'];
  };

  Viewer3D.onLoad = function(){
    var that = this;
    this._vw = 150;
    this._vh = 100;

    this.alpha = 0.2;
    this.delta = 2.5;
    this.fX = 0;
    this.fY = 0;
    this.fZ = 0;
    this.inputX = 0;
    this.inputY = 0;
    this.inputZ = -20;
    this._preX = 0;
    this._preY = 0;
    this._preZ = 0;

    // Load our custom properties panel
    this.preloadTemplate('properties.html').then(function(template){
      that._propTemplate = template;
      // Load three.js
      require([that.assetsFolder + 'assets/three.min.js'], function(threejs){
        console.log("threejs loaded loaded: ", threejs);
      });
    }).catch(function(err){
      console.log("Error preloading template: ", err);
    });

    // Define an event listener
    this.onData(function(data, target){
      analyseData.call(that, data, target);
    });

    // 3D Graphics initscene = new THREE.Scene();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, this._vw / this._vh, 1, 10000 );
    this.camera.position.z = 250;

    // Load materials
    this.materials = [];
    var totalLoaded = 0;
    var loader = new THREE.TextureLoader();
    var i = 1;
    var loadNext = function(){
      loader.load(that.assetsFolder+'/assets/images/block'+i+'.png', function (texture) {
        var mat = new THREE.MeshBasicMaterial({color: 0xffffff, map: texture});
        that.materials.push(mat);
        if(i == 6){
          return renderObjects.call(that);
        }else{
          i++;
          return loadNext();
        }
      });
    };

    return loadNext();
  };

  // 3D rendering.
  function renderObjects(){
    var geometry = new THREE.BoxGeometry(200, 100, 200, 3, 3, 3);
    this.mesh = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(this.materials) );

    this.scene.add(this.mesh);
    this.renderer = new THREE.WebGLRenderer({alpha: true});
    // this.renderer.setSize( this._vw, this._vh );
    var viewerId = "viewer-"+this.id;
    this.renderer.domElement.setAttribute("id", viewerId);

    // Remove canvas in case already exists
    if($("#"+viewerId).length){
      $("#"+viewerId).remove();
    }

    this.canvasIcon.find(".viewer3DContainer").append(this.renderer.domElement);
    // this.canvasIcon.find(".viewer3DContainer #"+viewerId).css("")
    this.abortRender = false;
    this.animationController = animate.bind(this);
    return animate.call(this);
  }

  function animate() {

    if(!this.abortRender){
      requestAnimationFrame(this.animationController);
    }


    if(this.inputX !== undefined){
      if(Math.abs(this._preX-this.inputX) < this.delta){
        this.inputX = this._preX;
      }

      if(Math.abs(this._preY-this.inputY) < this.delta){
        this.inputY = this._preY;
      }

      if(Math.abs(this._preZ-this.inputZ) < this.delta){
        this.inputZ = this._preZ;
      }

     //Low Pass Filter
     this.fX = this.inputX * this.alpha + (this.fX * (1.0 - this.alpha));
     this.fY = this.inputY * this.alpha + (this.fY * (1.0 - this.alpha));
     this.fZ = this.inputZ * this.alpha + (this.fZ * (1.0 - this.alpha));

     var pitch = Math.atan(this.fX/Math.sqrt(Math.pow(this.fY,2) + Math.pow(this.fZ,2)));
     var roll = Math.atan(this.fY/Math.sqrt(Math.pow(this.fX,2) + Math.pow(this.fZ,2)));


     // In radians
     this.mesh.rotation.x = pitch;
     this.mesh.rotation.z = roll;
    }

    this._preX = this.inputX;
    this._preY = this.inputY;
    this._preZ = this.inputZ;
    this.renderer.render( this.scene, this.camera );
  }


  Viewer3D.onClick = function(){
    Ppanel.loading();

    // Load basic properties?
    this.loadBaseFeeds();

    // Any processing here
    var html = this._propTemplate(this);
    this._container = this.displayCustomSettings($(html));

  };

  function analyseData(data, targetInput){
    if(targetInput === 'Pitch'){
      this.inputX = data;
    }else if(targetInput === 'Roll'){
      this.inputY = data;
    }else if(targetInput === 'Yaw'){
      this.inputZ = data;
    }else{
      console.log("This widget doesn't have an input '%s'", targetInput);
    }
  }

  return Viewer3D;
});
