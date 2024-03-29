/*
 * Project:     TailgateTok
 * Description: Video chat and intant message while watching a live game.
 * Website:     http://tailgate.opentok.com
 * 
 * Author:      Ezra Velazquez
 * Website:     http://ezraezraezra.com
 * Date:        September 2011
 * 
 */

/** @namespace Holds functionality for automatically managing the layout of OpenTok streams */
var OT_LayoutContainer = function() {
	/** @private */
	var Width;
	
	/** @private */
	var Height;
	
	/** @private */
	var containerId;
	
	/** @private */
	function adjustImgRatio(img){
		if (img.style.height < img.style.width) {
			img.style.height = '100%';
			img.style.width = 'auto';
		}
		else {
			img.style.width = '100%';
			img.style.height = 'auto';
		}
	}	
	
	/** @scope LayoutContainer */
	return {
		/**
		 * Initializes the LayoutContainer.  Must be called prior to any other functions.
		 * @param {String} divId ID of DIV to be used as the container.
		 * @param {int} width Width of container DIV.
		 * @param {int} height Height of container DIV.
		 */
		init: function(divId, width, height){
			containerId = divId;
			Width = width;
			Height = height;
		},
		
		/**
		 * Updates the container to incorporate any added or removed streams.
		 */
		layout: function(){
			// Set the size of the container
			var subscriberBox = document.getElementById(containerId);
			subscriberBox.style.position = "relative";
			subscriberBox.style.width = Width + "px";
			subscriberBox.style.height = Height + "px";
			
			// Aspect ratio of the streams
			var vid_ratio = 3/4;

			// Finds the ideal number of columns and rows to minimize the amount of wasted space
			var count = subscriberBox.children.length;
			var min_diff;
			var targetCols;
			var targetRows;
			var availableRatio = Height / Width;
			for (var i=1; i <= count; i++) {
				var cols = i;
				var rows = Math.ceil(count / cols);
				var ratio = rows/cols * vid_ratio;
				var ratio_diff = Math.abs( availableRatio - ratio);
				if (!min_diff || (ratio_diff < min_diff)) {
					min_diff = ratio_diff;
					targetCols = cols;
					targetRows = rows;
				}
			};

			
			var videos_ratio = (targetRows/targetCols) * vid_ratio;

			if (videos_ratio > availableRatio) {
				targetHeight = Math.floor( Height/targetRows );
				targetWidth = Math.floor( targetHeight/vid_ratio );
			} else {
				targetWidth = Math.floor( Width/targetCols );
				targetHeight = Math.floor( targetWidth*vid_ratio );
			}

			var spacesInLastRow = (targetRows * targetCols) - count;
			var lastRowMargin = (spacesInLastRow * targetWidth / 2);
			var lastRowIndex = (targetRows - 1) * targetCols;

			var firstRowMarginTop = ((Height - (targetRows * targetHeight)) / 2);
			var firstColMarginLeft = ((Width - (targetCols * targetWidth)) / 2);
			
			// Loop through each stream in the container and place it inside
			var x = 0;
			var y = 0;
			for (i=0; i < subscriberBox.children.length; i++) {
				if (i % targetCols == 0) {
					// We are the first element of the row
					x = firstColMarginLeft;
					if (i == lastRowIndex) x += lastRowMargin;
					y += i == 0 ? firstRowMarginTop : targetHeight;
				} else {
					x += targetWidth;
				}
				
				var parent = subscriberBox.children[i];
				var child = subscriberBox.children[i].firstChild;
				
				// All streams placed in absolute position relative to the layout container
				parent.style.position = "absolute"; 
				
				// Set position and size of the stream container
				parent.style.left = x + "px";
				parent.style.top = y + "px";
				parent.style.width = targetWidth + "px";
				parent.style.height = targetHeight + "px";
				
				// Set the height and width of the flash object (stream) that sits in the contaienr
				child.width = targetWidth;
				child.height = targetHeight;
				
				child.style.width = targetWidth + "px";
				child.style.height = targetHeight + "px";
			};
		},
		/**
		 * Adds a stream HOLDER to the layout container
		 * The actual stream is added by TB_VIDEO.js
		 * @param {String} divId The ID of the DIV container that is passed to session.subscribe() or session.publish()
		 * @param {bool} publisher True if the stream divId being passed in is a publisher.  False if the stream divId is a subscriber.
		 */
		addStream: function(divId, publisher, user_name) {
			var container = document.createElement("div");
			var divId_pure;
			var backgroundImg;
			if (publisher) {
				// Put the publisher object in front to allow clicking permissions dialog
				container.style.zIndex = 10;	
			}
			else {
				divId_pure = divId.split('_')[1];
				backgroundImg = 'http://graph.facebook.com/'+divId_pure+'/picture?type=large';
			}
			var div = document.createElement("div");
			div.setAttribute('id', divId);
			div.setAttribute('class', 'div_img');
			var div_img = document.createElement("img");
			div_img.setAttribute('class', 'div_img');
			div_img.setAttribute('src', backgroundImg);
			adjustImgRatio(div_img);
			
			var div_bar = document.createElement("div");
			div_bar.setAttribute('class', 'div_bar');
			div_bar.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;"+user_name;
			
			div.appendChild(div_img);
			div.appendChild(div_bar);
			container.appendChild(div);
			
			var subscriberBox = document.getElementById(containerId);
			subscriberBox.appendChild(container);			
		},
		
		/**
		 * Removes a stream HOLDER from the layout container
		 * @param {String} subscriberId The ID of the subscriber object from the stream to be removed.
		 */
		removeStream: function(subscriberId) {
			// Gets the container that holds the flash object (stream) and removes it from the page
			var obj = document.getElementById(subscriberId);
			var container = obj.parentNode;
			container.parentNode.removeChild(container);
		}
	};
}();