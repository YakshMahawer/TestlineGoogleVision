const dropArea = document.querySelector(".drop_box"),
  button = dropArea.querySelector("button"),
  dragText = dropArea.querySelector("header"),
  input = document.getElementById('image');
document.getElementById('imageForm').addEventListener('submit', function(event) {
    event.preventDefault();
    // Show loader
    document.getElementById('loader').classList.remove('hidden');

    const formData = new FormData();
    const fileInput = document.getElementById('image');
    const file = fileInput.files[0];
    formData.append('image', file);
    console.log(formData);
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('loader').classList.add('hidden');
        let filedata = `
            <div class='og_div'>
            <img id="orignal_image" alt="">
            <button class='btn' onclick="reload()">START OVER</button>
            </div>
        `;
        dropArea.innerHTML = filedata;
        document.getElementById('textContent').textContent = data.text;
        document.getElementById('imageContent').src = 'data:image/png;base64,' + data.image;
        document.getElementById('orignal_image').src = 'data:image/png;base64,' + data.og_img;
        document.getElementsByClassName('extracted_info')[0].style.display = 'flex';
        const webEntitiesList = document.getElementById('webEntitiesList');
                    webEntitiesList.innerHTML = '';
                    data.label.forEach(entity => {
                        const li = document.createElement('li');
                        li.textContent = entity;
                        webEntitiesList.appendChild(li);
                    });

    })
    .catch(error => console.error('Error:', error));
});

let file;
var filename;

button.onclick = () => {
  input.click();
};

function copyText() {
    var text = document.getElementById("textContent").innerText;
    
    var tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);

    tempTextArea.select();
    tempTextArea.setSelectionRange(0, 99999);

    document.execCommand("copy");

    document.body.removeChild(tempTextArea);

}

function downloadText() {
    var text = document.getElementById("textContent").innerText;
    var blob = new Blob([text], { type: "text/plain" });
    var link = document.createElement("a");
    link.download = "textfile.txt";
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadImage() {
    var img = document.getElementById("imageContent").src;
    var link = document.createElement("a");
    link.download = "image.png";
    link.href = img;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function reload(){
    location.reload();
}
input.addEventListener("change", function (e) {
  var fileName = e.target.files[0].name;
  let filedata = `
    <form id='imageForm'>
    <div class="form">
    <h4>${fileName}</h4>
    <button type="submit" value="Upload" class="btn" id= "extract">Extract Text And Images</button>
    </div>
    </form>`;
  dropArea.innerHTML = filedata;
});
