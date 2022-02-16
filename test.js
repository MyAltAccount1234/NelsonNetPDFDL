console.log("Overwriting webpage...")

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

browser.runtime.sendMessage({action: "getPage", file: "printHandler"}).then(page => {
	// Do inital clear before nelson can stop me (They seem to break my script if I load too late)
	document.body.innerHTML = ""
	document.head.innerHTML = ""
	setTimeout(async () => {
		// Replace html with our own
		document.head.innerHTML = '<title>NelsonNet PDF converter</title>' // Kill nelsons JS
		document.body.innerHTML = page
		console.clear() // Remove error messages that Readium is throwing
		let info = JSON.parse(getCookie("user-info")) // Get user info from cookie
		let bookID = location.toString().match("#book/([^/]+)")[1] // epic
		let infoURL = `https://ops.nelsonnet.com.au/ops/user/${info.id}/book/${bookID}/details?time=${Date.now()}`
		// Get the book info
		let resp = await fetch(infoURL, {
			headers: {
				"accessToken": info.accessToken,
				"subscriptionId": info.subscriptionId
			}
		})
		// Get the book info
		let bookInfo = await resp.json()
		let sourceURL = bookInfo.src_url + "/OEBPS/"
		// Get ebook info
		var ebookMetadata = await fetch(bookInfo.src_url + bookInfo.package_doc_path, { 
		    "credentials": "include",
				headers: {
					"accessToken": info.accessToken,
					"subscriptionId": info.subscriptionId,
					"bookVersion": bookInfo.version,
					"X-Requested-With": "XMLHttpRequest",
	        "Sec-Fetch-Dest": "empty",
	        "Sec-Fetch-Mode": "cors",
	        "Sec-Fetch-Site": "same-origin",
	        "Accept": "text/plain, */*; q=0.01",
	        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:97.0) Gecko/20100101 Firefox/97.0",
				},
				mode: "cors",
		    "referrer": "https://ebooks.nelsonnet.com.au/wr/viewer.html?subscriptionId=" + info.subscriptionId,
			})

    var metadataText = await ebookMetadata.text()
    // Fixes an issue with the content.opf file I think
	  metadataText = metadataText.replace(/href="\/" id=/, 'href="cover.jpg" id=') // Can probs be removed
	  // Gets all the links for the content
	  console.log(metadataText)
    var links = metadataText.match(/<itemref idref="(.*)"/g) // Using links via itemref gives us the correct sorting
    console.log(links)
		document.getElementById("progressBar").setAttribute("max", links.length)
		document.getElementById("currentTask").innerText = "Building book"
	  // Downloads each page/image/font and adds it to the zip file
	  function addIFrame(index) {
	  	if (index < links.length) {
		  	const item = links[index]
	      let itemName = item.split('\"')[1]
	      // For some reason the items sometimes don't have .xhtml on the end
	      if (itemName.indexOf(".xhtml") === -1) {
	      	itemName += ".xhtml"
	      }
		  	console.log(itemName)
	      const href = sourceURL + itemName
	      if (itemName.indexOf(".xhtml") !== -1) {
					let frame = document.createElement("iframe")
					frame.src = href
					document.getElementById("books").appendChild(frame)
					// Once frame is loaded, make next iframe
					frame.onload = () => {
						// Make size be correct
						frame.style.width = frame.contentWindow.document.body.scrollWidth + "px"
						frame.style.height = frame.contentWindow.document.body.scrollHeight + "px"
						addIFrame(index + 1) // Load next iframe
					}
					document.getElementById("progressBar").setAttribute("value", index + 1)
	    	} else {
					document.getElementById("progressBar").setAttribute("value", index + 1)
	    		addIFrame(index + 1)
	    	}
	  	} else {
	  		setTimeout(() => window.print(), 5000)
	  	}
	  }
		addIFrame(0)
		document.getElementById("currentTask").innerText = "Done, you can print the book"
		// alert("The book is finished, please print to pdf")
	}, 5000)
})
