/*
	Copyright 2020, Aline Abler

    This file is part of Bildli Gallery.

    Bildli Gallery is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Bildli Gallery is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Bildli Gallery.  If not, see <https://www.gnu.org/licenses/>.
*/

var lastFocusedElement = null;
var populatedUntil = 0;
var activePushBlocks = [];
var numCols = getColumnCountForWidth(window.innerWidth);

var images = []
fetch("assets/images.json")
.then(response => response.json())
.then(imageList => {
    images = imageList;
    populateInitial(imageList);
});

function populateInitial(imageList) {
    createColumns();
    path = window.location.href.split("/gallery/")[1];
    if (path) {
        image = imageList.find(elem => elem.slug === path);
        if (image) {
            index = imageList.indexOf(image);
            populate(index + 4 * numCols);
            setTimeout(function() { focusOnImage(path)}, 100);
        }
        else {
            populate(8 * numCols);
        }
    }
    else {
        populate(8 * numCols);
    }
}

function populate(num) {
    for (var i = populatedUntil; i < num + populatedUntil; i = i + 1) {
        if (i >= images.length) {
            break;
        }
        colIndex = i % numCols;
        const col = `col-${colIndex}`;
        const img = images[i].slug;
        const div = `${img}-div`;

        const titleClass = images[i].dark_title ? "dark" : "light";
        const descClass = images[i].dark_desc ? "dark" : "light";

        var pusher = document.createElement("DIV");
        pusher.classList.add('push-block');
        pusher.id = img + "-push";

        var imagediv = document.createElement("DIV");
        imagediv.classList.add('gallery-image-div');
        imagediv.id = div;
        imagediv.innerHTML = `
            <div class="gallery-title-wrapper">
                <div class="gallery-title ${titleClass}">
                    <span class="gallery-title"> ${images[i].title} </span>
                    <span class="gallery-close" onclick="unfocus()"> x </span>
                </div>
            </div>
            <img src="${images[i].src}" class="gallery-image" id="${img}" onclick="focusOnImage('${img}', false)" />
            <div class="gallery-description-wrapper">
                <div class="gallery-description ${descClass}">
                    <span class="gallery-description">${images[i].desc}</span>
                    <span class="gallery-info">${images[i].info}</span>
                    <span class="gallery-date">${images[i].date}</span>
                </div>
            </div>
        `;

        document.getElementById(col).appendChild(pusher);
        document.getElementById(col).appendChild(imagediv);
    }
    populatedUntil = populatedUntil + num;
}

function reshuffle() {
    document.getElementById("gallery").innerHTML = "";
    createColumns();
    oldPopulatedUntil = populatedUntil;
    populatedUntil = 0;
    populate(oldPopulatedUntil);
    if (lastFocusedElement) {
        lastFocusedImage = lastFocusedElement.id.substring(0, lastFocusedElement.id.length - 4);
        focusOnImage(lastFocusedImage);
    }
}

function createColumns() {
    numCols = getColumnCountForWidth(window.innerWidth);
    rootElem = document.getElementById("gallery");
    var col = document.createElement("DIV");
    col.classList.add('col');
    col.classList.add('col-left');
    col.id = "col-0"
    dummyImg = document.createElement("DIV")
    dummyImg.id = "imgA"
    dummyImg.classList.add("gallery-image-div")
    col.appendChild(dummyImg);
    rootElem.appendChild(col)

    for(var i = 1; i < numCols - 1; i = i + 1) {
        var col = document.createElement("DIV");
        col.classList.add('col');
        col.classList.add('col-center');
        col.id = `col-${i}`
        rootElem.appendChild(col)
    }

    if (numCols > 1) {
        var col = document.createElement("DIV");
        col.classList.add('col');
        col.classList.add('col-right');
        col.id = `col-${numCols - 1}`
        rootElem.appendChild(col)
    }
}

function checkScroll() {
	var h = document.documentElement, 
		b = document.body,
		st = 'scrollTop',
		sh = 'scrollHeight';

	var percent = (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;

	if (percent > 90) {
		populate(4 * numCols);
    }
}

function checkHistory(event) {
    if (event.state) {
        focusOnImage(event.state.image, true);
    }
    else {
        unfocus();
    }
}

function checkResize() {
    var width = window.innerWidth;
    if (getColumnCountForWidth(width) != numCols) {
        reshuffle();
    }
}

function getColumnCountForWidth(width) {
    var newColumns = width < 500 ? 1 : 
        width < 700 ? 2 :
        width < 900 ? 3 :
        width < 1100 ? 4 :
        5;
    return newColumns;
}

function unfocus() {
    if (lastFocusedElement != null) {
        lastFocusedElement.classList.remove("expand");
        lastFocusedElement.classList.remove("expand-little");
    }
    for (let block of activePushBlocks) {
        block.style.height = 0;
    }
    activePushBlocks = [];
    lastFocusedElement = null;
}

function focusOnImage(img, fromHistory) {
    var defaultImageWidth = document.getElementById('imgA').getBoundingClientRect().width;
    var imageDiv = document.getElementById(`${img}-div`);
    var column = imageDiv.parentElement;
    var col = column.id;
    var isHighImage = imageDiv.classList.contains('expand-little');


    var imagePos = getNormalizedImagePosInColumn(imageDiv, column);
    currImageWidth = imageDiv.getBoundingClientRect().width;
    var newImageHeight;
    var expandLittle = false;
    if (currImageWidth > defaultImageWidth + 5) {
        newImageHeight = imageDiv.getBoundingClientRect().height;
    }
    else if (numCols == 2) {
        newImageHeight = Math.ceil(imageDiv.getBoundingClientRect().height) * 2;
        // this special case trips expandLittle flag but does not actually end up
        // using expand-little class
        expandLittle = true;
    }
    else {
        newImageHeight = Math.ceil(imageDiv.getBoundingClientRect().height) * 3;
    }

    unfocus();
    vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

    isHighImage = isHighImage || newImageHeight > vh;

    if (isHighImage) {
        newImageHeight = Math.ceil(imageDiv.getBoundingClientRect().height) * 2;
        expandLittle = true;
        imageDiv.classList.add("expand-little");
    }
    else {
        imageDiv.classList.add("expand");
    }

    lastFocusedElement = imageDiv;

    var colIndex = Number(col.split("-")[1]);
    var leftColIndex = colIndex - 1
    var rightColIndex = colIndex + 1

    var colIndices = expandLittle ? [rightColIndex] : [leftColIndex, rightColIndex];

    if (colIndex === 0) {
        colIndices = expandLittle ? [1] : [1, 2];
    }
    if (colIndex === numCols - 1) {
        colIndices = expandLittle ? [numCols - 2] : [numCols - 3, numCols - 2];
    }
    if (numCols === 2 && colIndex === 1) {
        colIndices = [0];
    }

    adjustPushBlocks(colIndices, imagePos, newImageHeight);

    window.scrollTo({ top: imagePos, behavior: 'smooth' });
    if (!fromHistory) {
        window.history.pushState({"image": img}, document.title, img);
    }

    setTimeout(function() {
            var realHeight = imageDiv.getBoundingClientRect().height;
            adjustPushBlocks(colIndices, imagePos, realHeight);
    }, 550);

}

function adjustPushBlocks(colIndices, imagePos, newImageHeight) {
    var defaultImageWidth = document.getElementById('imgA').getBoundingClientRect().width;
    for (let i of colIndices) {
        column = document.getElementById('col-' + i);
        var childPos = 0;
        for (let child of column.children) {
            if (child.classList.contains('gallery-image-div')) {
                normalizedChildHeight = (child.getBoundingClientRect().height * defaultImageWidth) / child.getBoundingClientRect().width;
                var childBottomPos = childPos + normalizedChildHeight;
                if (childBottomPos > imagePos) {
                    pushBlock = document.getElementById(child.id.substring(0, child.id.length - 4) + "-push");
                    pushHeight = newImageHeight + imagePos - childPos;
                    pushBlock.style.height = pushHeight + 'px';
                    activePushBlocks.push(pushBlock);
                    break;
                }
                childPos = childBottomPos;
            }
        }
    }
}

function getNormalizedImagePosInColumn(imageDiv, column) {
    var defaultImageWidth = document.getElementById('imgA').getBoundingClientRect().width;
    var imagePos = 0;
    for (let child of column.children) {
        if (child.classList.contains('gallery-image-div')) {
            if (child == imageDiv) {
                break;
            }
            imagePos = imagePos + (child.getBoundingClientRect().height * defaultImageWidth) / child.getBoundingClientRect().width;
        }
    }
    return imagePos;
}

window.addEventListener('scroll', checkScroll);
window.onpopstate = checkHistory;
window.onresize = checkResize;
