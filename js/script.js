var map;
var infowindow;

var locations = [
    {
        position: {lat:  47.550259, lng: -122.264847},
		name: "Seward Park"
    },
    {
        position: {lat: 47.721790, lng: -122.327209},
		name: "Northacres Park"
    },
    {
        position: {lat: 47.630127, lng: -122.314636},
		name: "Volunteer Park"
    },
    {
        position: {lat: 47.622120, lng: -122.284554},
		name: "Lakeview Park"
    },
    {
        position: {lat: 47.563450, lng:-122.404251},
		name: "Me-Kwa-Mooks Park"
    },
    {
        position: {lat: 47.620598, lng:  -122.361816 },
		name: "Myrtle Edwards Park"
        
    }
];
// Create a styles array to use with the map.
        var styles = [
          {
            featureType: 'water',
            stylers: [
              { color: '#19a0d8' }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.stroke',
            stylers: [
              { color: '#ffffff' },
              { weight: 6 }
            ]
          },{
            featureType: 'administrative',
            elementType: 'labels.text.fill',
            stylers: [
              { color: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -40 }
            ]
          },{
            featureType: 'transit.station',
            stylers: [
              { weight: 9 },
              { hue: '#e85113' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
              { visibility: 'off' }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.stroke',
            stylers: [
              { lightness: 100 }
            ]
          },{
            featureType: 'water',
            elementType: 'labels.text.fill',
            stylers: [
              { lightness: -100 }
            ]
          },{
            featureType: 'poi',
            elementType: 'geometry',
            stylers: [
              { visibility: 'on' },
              { color: '#f0e4d3' }
            ]
          },{
            featureType: 'road.highway',
            elementType: 'geometry.fill',
            stylers: [
              { color: '#efe9e4' },
              { lightness: -25 }
            ]
          }
        ];
function googleError() {
     document.getElementById('loading_map_error').style.display = 'block';
	// error handling here
	alert("failed to get google map resources");

}

// google map class
function initMap() {

    map = new google.maps.Map(document.getElementById('map'), {
        center:{ lat: 47.620598, lng: -122.361816},
		zoom: 10,
        mapTypeControl: false,
        styles: styles
    });

    infowindow = new google.maps.InfoWindow({
        content: ""
    });

    //first init marker array
    contentPlace.filterList().forEach(function (placeData) {
        var marker = new google.maps.Marker({
            position: {lat: placeData.lat, lng: placeData.lng},
            map: map,
            title: placeData.name,
            animation: google.maps.Animation.DROP,
        });

        placeData.marker = marker;

        marker.addListener('click', function () {
            contentPlace.itemClick(placeData);
        });

    });
}

function placeStore(data) {
    var self = this;
    self.name = data.name;
    self.lat = data.position.lat;
    self.lng = data.position.lng;
    self.marker = null;
}

// Removes the markers from the map, but keeps them in the array.
function clearMarkers() {
    contentPlace.placesList().forEach(function (placeData) {
        placeData.marker.setVisible(false);
    });
}
//show the info Window when click on marker or list
function showInfoWindow(contentString, placeData) {
    if (infowindow) {
        infowindow.close();
        infowindow.setContent(contentString);
        infowindow.open(map, placeData.marker);
    }
}

function ViewModel() {
    var self = this;

    //current selected location
    self.selectedPlace = ko.observable();

    //Search string
    self.filterInput = ko.observable('');

    self.placesList = ko.observableArray([]);

    locations.forEach(function (placeData) {
        self.placesList.push(new placeStore(placeData));
    });

    self.animate = function () {
        self.placesList().forEach(function (placeData) {
            placeData.marker.setAnimation(null);
        });

        if (self.selectedPlace) {
            if (self.selectedPlace.marker.getAnimation() === null) {
                self.selectedPlace.marker.setAnimation(google.maps.Animation.BOUNCE);
            } else {
                self.selectedPlace.marker.setAnimation(null);
            }
        }
    };

    // handle item click
    self.itemClick = function (placeData) {
        self.selectedPlace = placeData;
        map.setCenter(placeData.marker.getPosition());
        self.animate();
        //search wikipedia for info on place
        $.ajax({
            url: 'https://en.wikipedia.org/w/api.php?action=opensearch&format=json&callback=wikiCallBack&search=',
            data: {action: 'opensearch', search: placeData.name, format: 'json'},
            dataType: 'jsonp'
        }).done(
            function (data) {
                var contentString ='<h3>' + data[1][0]+ '</h3>' +'<div>' +'<p>' + data[2][0] + '</p>' +'</div>' +'<a href="' + data[3][0]+ '">wikipedia</a>';
                showInfoWindow(contentString, placeData);
            }).fail(function (jqXHR, textStatus) {
            alert('failed to get wikipedia resources');
        });
    };

    // filter list and filiter on the map
    self.filterList = ko.computed(function () {
        var filter = self.filterInput().toLowerCase();

        if (filter) {
             clearMarkers();
            return ko.utils.arrayFilter(self.placesList(), function (item) {
                var result = item.name.toLowerCase().indexOf(filter) !== -1;

                // marker on map
                if (result && item.marker) {
                    item.marker.setVisible(true);
                }

                return result;
            });
        
        } else {
            if (map) {
                self.placesList().forEach(function (placeData) {
                    placeData.marker.setVisible(true);
                });
            }

            return self.placesList();
           
        }
    });
}

var contentPlace = new ViewModel();
ko.applyBindings(contentPlace);


// resize function for resizing map
$(window).resize(function () {
    var h = $(window).height(),
        offsetTop = 60; // Calculate the top offset
    $('#map').css('height', (h - offsetTop));
}).resize();