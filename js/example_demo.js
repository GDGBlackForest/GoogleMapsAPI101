Example	= function() {
	
	var that 				= {};
	
	that._mapElement		= false;
	that._mapObject			= false;
	that._mapOptions		= {};
	that._mapMarkers		= [];
	that._mapEventListener	= null;
	that._mapGeocoder;
	
	that._drawingsManager 	= null;
	that._drawingsActive	= false;
	
	that._selectedShape;
	
	that._colors 			= ['#FF0000', '#CCCCCC', '#000000', '#1E90FF', '#FF1493', '#32CD32', '#FF8C00', '#4B0082'];
    that._selectedColor;
    that._colorButtons 		= {};
	
	that._searchBox			= null;
	
	that._searchBoxListener	= false;
	that._boundsListener	= false;

	// --------------------------------------------------
	that.init	= function(mapElement, mapOptions, mapMarkers) {
		
		that._mapElement	= mapElement;
		that._mapOptions	= mapOptions;
		that._mapMarkers	= mapMarkers;
		
	};
	
	// --------------------------------------------------
	that._toolboxInit	= function() {
		
		jQuery( '#toggleDrawingManager_Checkbox' ).on( 'change' , function() {
			that.toggleDrawingManager();
		});
		
		jQuery( 'input[name=setMapTypeId]' ).on( 'change' , function(e) {
			
			if (e.currentTarget.value == 'hybrid') {
				that._mapObject.setMapTypeId(google.maps.MapTypeId.HYBRID);
			} else if (e.currentTarget.value == 'satellite') {
				that._mapObject.setMapTypeId(google.maps.MapTypeId.SATELLITE);
			} else if (e.currentTarget.value == 'terrain') {
				that._mapObject.setMapTypeId(google.maps.MapTypeId.TERRAIN);
			} else {
				that._mapObject.setMapTypeId(google.maps.MapTypeId.ROADMAP);
			}
			
			
		});
		
		that._searchBox = new google.maps.places.SearchBox(document.getElementById('placesLookup_InputText'));
		
		var markers = [];
		
		that._searchBoxListener = google.maps.event.addListener(that._searchBox, 'places_changed', function() {
		
			var places = that._searchBox.getPlaces();

			if (places.length == 0) {
				return;
			}
			for (var i = 0, marker; marker = markers[i]; i++) {
				marker.setMap(null);
			}
			
			markers = [];
			var bounds = new google.maps.LatLngBounds();
			for (var i = 0, place; place = places[i]; i++) {
				var image = {
					url: 		place.icon,
					size: 		new google.maps.Size(71, 71),
					origin: 	new google.maps.Point(0, 0),
					anchor: 	new google.maps.Point(17, 34),
					scaledSize:	new google.maps.Size(25, 25)
				};

				var marker = new google.maps.Marker({
					map: 		that._mapObject,
					icon: 		image,
					title: 		place.name,
					position:	place.geometry.location
				});

				markers.push(marker);

				bounds.extend(place.geometry.location);
			}

			that._mapObject.fitBounds(bounds);
		});
		
		that._boundsListener = google.maps.event.addListener(that._mapObject, 'bounds_changed', function() {
			var bounds = that._mapObject.getBounds();
			that._searchBox.setBounds(bounds);
		});
		
	};
	
	// --------------------------------------------------
	that.toggleDrawingManager = function() {
		
		if (that._drawingsActive === false) {
		
			that._drawingsManager.setOptions({
				drawingControl: true
			});
			
			that._initListener();
			
			jQuery('#example_addedElementsList').show();
			
			that._drawingsActive = true;
			
		} else {
		
			that._drawingsManager.setOptions({
				drawingControl: false
			});
			
			jQuery('#example_addedElementsList').hide();
			
			that._drawingsActive = false;
			
		}
		
	};
	
	// --------------------------------------------------
	that._clearSelection = function() {
		if (that._selectedShape) {
			that._selectedShape.setEditable(false);
			that._selectedShape = null;
		}
	};

	// --------------------------------------------------
	that._setSelection = function(shape) {
		that._clearSelection();
		that._selectedShape = shape;
		shape.setEditable(true);
		that._selectColor(shape.get('fillColor') || shape.get('strokeColor'));
	};

	// --------------------------------------------------
	that._deleteSelectedShape = function() {
		if (that._selectedShape) {
			that._selectedShape.setMap(null);
		} else {
			alert('No shape selected');
		}
	};
	
	// --------------------------------------------------
	that._selectColor = function(color) {
	
		that._selectedColor = color;
        for (var i = 0; i < that._colors.length; ++i) {
			var currColor = that._colors[i];
			that._colorButtons[currColor].style.border = currColor == color ? '2px solid #789' : '2px solid #fff';
        }
		
        var polylineOptions = that._drawingsManager.get('polylineOptions');
        polylineOptions.strokeColor = color;
        that._drawingsManager.set('polylineOptions', polylineOptions);

        var rectangleOptions = that._drawingsManager.get('rectangleOptions');
        rectangleOptions.fillColor = color;
        that._drawingsManager.set('rectangleOptions', rectangleOptions);

        var circleOptions = that._drawingsManager.get('circleOptions');
        circleOptions.fillColor = color;
        that._drawingsManager.set('circleOptions', circleOptions);

        var polygonOptions = that._drawingsManager.get('polygonOptions');
        polygonOptions.fillColor = color;
        that._drawingsManager.set('polygonOptions', polygonOptions);
		
	};
	
	// --------------------------------------------------
	that._setSelectedShapeColor = function(color) {
	
		if (that._selectedShape) {
			if (that._selectedShape.type == google.maps.drawing.OverlayType.POLYLINE) {
				that._selectedShape.set('strokeColor', color);
			} else {
				that._selectedShape.set('fillColor', color);
			}
        }
		
	};
	
	// --------------------------------------------------
	that._makeColorButton = function(color) {
	
		var button = document.createElement('span');
        button.className = 'toolbox_colorButton';
        button.style.backgroundColor = color;
        google.maps.event.addDomListener(button, 'click', function() {
          that._selectColor(color);
          that._setSelectedShapeColor(color);
        });

        return button;
		
	};
	
	// --------------------------------------------------
	that._buildColorPalette = function() {
	
		var colorPalette = document.getElementById('toolbox_colorPalette');
		for (var i = 0; i < that._colors.length; ++i) {
			var currColor = that._colors[i];
			var colorButton = that._makeColorButton(currColor);
			colorPalette.appendChild(colorButton);
			that._colorButtons[currColor] = colorButton;
		}
		
		that._selectColor(that._colors[0]);
		
	}
	
	// --------------------------------------------------
	that._initListener = function() {
	
		google.maps.event.addListener(that._drawingsManager, 'overlaycomplete', function(event) {
		
			if (event.type != google.maps.drawing.OverlayType.MARKER) {
				that._drawingsManager.setDrawingMode(null);
				
				var newShape = event.overlay;
				newShape.type = event.type;
				google.maps.event.addListener(newShape, 'click', function() {
					that._setSelection(newShape);
				});
				that._setSelection(newShape);
			}
			
		});

	
	};

	// --------------------------------------------------
	that.loadMap	= function() {
		
		var mapOptions = {
			center: 		new google.maps.LatLng(that._mapOptions.center.latitude, that._mapOptions.center.longitude),
			zoom:			that._mapOptions.zoomLevel,
			mapTypeControl:	false
		};
					
		that._mapObject = new google.maps.Map(document.getElementById(that._mapElement), mapOptions);
		
		var bounds = new google.maps.LatLngBounds();
		
		for (i = 0; i < that._mapMarkers.length; i++) {

			
			marker = new google.maps.Marker({
				
				position: 	new google.maps.LatLng(that._mapMarkers[i][1], that._mapMarkers[i][2]),
				map: 		that._mapObject
				
			});
			
			bounds.extend( new google.maps.LatLng(that._mapMarkers[i][1], that._mapMarkers[i][2]) );
			
		}
		
		that._mapObject.fitBounds(bounds);
		
		that._toolboxInit();
		
		that._drawingsManager = new google.maps.drawing.DrawingManager({
		
			drawingControlOptions: {
				position: google.maps.ControlPosition.TOP_CENTER
			},
			
			markerOptions:{
				draggable: true
			},
			
			circleOptions: {
				strokeWeight: 0.5,
				fillOpacity: 0.45,
				editable: true
			},
			
			polylineOptions:{
				strokeWeight: 1.0,
				fillOpacity: 0.45,
				editable: true
			},
			
			rectangleOptions:{
				strokeWeight: 0.5,
				fillOpacity: 0.45,
				editable: true
			},
			
			polygonOptions:{
				strokeWeight: 0.5,
				fillOpacity: 0.45,
				editable: true
			},
			
			drawingControl: false
			
		});
		
		that._drawingsManager.setMap(that._mapObject);
		
		google.maps.event.addListener(that._drawingsManager, 'drawingmode_changed', that._clearSelection);
        google.maps.event.addListener(that._mapObject, 'click', that._clearSelection);
		google.maps.event.addDomListener(document.getElementById('delete-button'), 'click', that._deleteSelectedShape);
		
		that._buildColorPalette();
		
		that._mapGeocoder = new google.maps.Geocoder();
		
		var _addressLookupWrapper = (document.getElementById('addressLookup_wrapper'));
		that._mapObject.controls[google.maps.ControlPosition.TOP_RIGHT].push(_addressLookupWrapper);
		
		var _searchBox = (document.getElementById('placesLookup_InputText'));
		that._mapObject.controls[google.maps.ControlPosition.TOP_RIGHT].push(_searchBox);
		
	};	
	
	return that;
	
	
}();