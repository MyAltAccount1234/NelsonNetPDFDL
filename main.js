// Creates the zip file object
var zip = new JSZip()
// Runs a function on page load which waits 5 seconds for the Iframe to load in
window.onload = (async () => {
    setTimeout(async () => {
        try{
	        // Gets the source url from the Iframe
  	      var tempURL = document.getElementsByTagName("iframe")[1].src
					//Gets the content url, which is the book id + the book version
        	var contentURL = tempURL.substring(0, tempURL.lastIndexOf("/")) + "/"
					// Information for the ebook
        	var ebookMetadata = await fetch(contentURL + "content.opf")
					if (ebookMetadata.status === 403) {
					// Some books use package.opf
						ebookMetadata = await fetch(contentURL + "package.opf")
					}
        	var metadataText = await ebookMetadata.text()
        	// Fixes an issue with the content.opf file I think
					metadataText = metadataText.replace(/href="\/" id=/, 'href="cover.jpg" id=')
					// Gets all the links for the content
	        var links = metadataText.match(/href="(.*)" id=/g)

					// Adds the metadata info to the zip file
	        zip.file("mimetype", "application/epub+zip")
	        zip.file("META-INF/container.xml", '<?xml version="1.0" encoding="UTF-8" ?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>')
	        zip.file("content.opf", metadataText)

					// Downloads each page/image/font and adds it to the zip file
	        for (item of links) {
	            var itemName = item.split('\"')[1]
	            var href = contentURL + itemName
	            var data = await fetch(href)
	            var fileData
							// Checks whether it neds to get the text or the bytes of the response
	            if (itemName.indexOf(".xhtml") !== -1) {
	                fileData = await data.text()
	            } else {
	                fileData = await data.blob()
	            }
	            zip.file(itemName, fileData)
	        }
					// saves the zip
	        console.log('start packaging')
	        zip.generateAsync({type: "blob"})
	            .then(function(content) {
	                saveAs(content, "book.epub");
	            });
	        }
	        catch(err) {
	            console.log(err)
	            return
	        }
		

    }, 5000)



})
