
let walletAddress = "";
let contract = null;

let FileContent = '';
let FileName = '';
let updatedFiles = [];
let existingFiles = [];

// Function to get existing files and their hash values (replace this with your actual implementation)
async function getExistingFiles() {
  try {
    const contract = await connectWallet();
    if (contract) {
      // Assuming the contract has a function to get all existing file URLs
      const existingFileURLs = await contract.getAllFileURLs();

      // Populate existingFiles array with the current state of files
      for (const url of existingFileURLs) {
        let fileName1;  // Declare fileName1 here to widen its scope
        const fileExists = await contract.doesFileExist(url);
        if (fileExists) {
          fileName1 = url;  // Assign the value to fileName1
          const fileHash = await contract.getFileHash(url);
          existingFiles.push({ url, hash: fileHash });
        }
        // You can use fileName1 outside the if block here
      }
    }
  } catch (err) {
    console.error("Error fetching existing files:", err);
    alert("Error fetching existing files. Check console for details.");
  }
}



// Call the function to get existing files when the page loads
window.onload = async function () {
  await getExistingFiles();
};

function uploadAndExtract() {
  const fileInput = document.getElementById('fileInput');
  const contentDisplay = document.getElementById('contentDisplay');

  const file = fileInput.files[0];

  if (file) {
    FileName = file.name;

    const reader = new FileReader();

    reader.onload = function (e) {
      const content = e.target.result;
      FileContent = content;
      displayContent(content);
    };

    reader.readAsText(file);
  } else {
    alert('Please,! select a file.');
  }
}

const displayContent = function(content, uploaderAddress) {
  const contentDisplay = document.getElementById('contentDisplay');
  contentDisplay.textContent = `File Name: ${FileName}\n\nFile content:\n\n${content}\n\nUploader's Address: ${uploaderAddress}`;
};

async function requestAccount() {
  if (window.ethereum) {
    console.log("MetaMask detected !");
  } else {
    alert("MetaMask isn't detected! Please install MetaMask Extension first");
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    walletAddress = accounts[0];
  } catch (err) {
    console.error(err);
  }
}

async function connectWallet() {
  if (typeof window.ethereum !== 'undefined') {
    await requestAccount();
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contractAddress = "0x9A35B612Be2aFD72C1C43D0a8CBcc597b5EC427F";
      const ABI =[
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "string",
              "name": "url",
              "type": "string"
            },
            {
              "indexed": false,
              "internalType": "bytes32",
              "name": "fileHash",
              "type": "bytes32"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "uploader",
              "type": "address"
            }
          ],
          "name": "FileHashUpdated",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_url",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_content",
              "type": "string"
            }
          ],
          "name": "updateFileHash",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "admin",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_url",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_newContent",
              "type": "string"
            }
          ],
          "name": "checkDataIntegrity",
          "outputs": [
            {
              "internalType": "string",
              "name": "",
              "type": "string"
            },
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_url",
              "type": "string"
            }
          ],
          "name": "doesFileExist",
          "outputs": [
            {
              "internalType": "bool",
              "name": "",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getAllFileURLs",
          "outputs": [
            {
              "internalType": "string[]",
              "name": "",
              "type": "string[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_url",
              "type": "string"
            }
          ],
          "name": "getFileHash",
          "outputs": [
            {
              "internalType": "bytes32",
              "name": "",
              "type": "bytes32"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ];
      const contract = new ethers.Contract(contractAddress, ABI, signer);

      return contract;
    } catch (err) {
      console.error("Error connecting to contract:", err.message);  // Log the error message
      alert("Error connecting to contract. Check console for details.");
      return null;
    }
  }
  console.error("MetaMask not detected!");
  alert("MetaMask isn't detected! Please install MetaMask Extension first");
  return null;
}

async function updateFileHash() {
  let fileContent = FileContent;
  let fileName1 = FileName;
  let uploaderAddress; // Declare uploaderAddress here

  if (fileName1 == "") {
    document.getElementById("result").innerText = "Please choose a file and extract its content to update its hash!";
  } else {
    try {
      const contract = await connectWallet();

      if (contract) {
        // Check if the file already exists
        const fileExists = await contract.doesFileExist(fileName1);

        // Retrieve the current hash from the contract
        const currentContentHash = fileExists ? await contract.getFileHash(fileName1) : null;

        // Calculate hash of the new content using ethers.utils.keccak256
        const newContentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(fileContent));

        // Check if the content has changed
        if (currentContentHash === newContentHash) {
          // Content is the same, no modification detected
          document.getElementById("result").innerText = "File content is the same. No modification detected.";
          return;
        }

        // Update the existing file information in existingFiles array
        const existingFileIndex = existingFiles.findIndex(existing => existing.url === fileName1);
        if (existingFileIndex !== -1) {
          existingFiles[existingFileIndex].hash = fileContent;
        }

        // Update the file hash without checking if it already exists
        const updateFH = await contract.updateFileHash(fileName1, fileContent);
        await updateFH.wait();

        // Access the fileInformation using the new function
        const fileHash = await contract.checkDataIntegrity(fileName1, fileContent);
        uploaderAddress = fileHash[1]; // Assign the value here

        // Add updated file to the list
        updatedFiles.push({
          url: fileName1,
          uploader: uploaderAddress,
          date: new Date().toLocaleDateString(),
          hour: new Date().toLocaleTimeString(),
        });

        // File was updated
        document.getElementById("result").innerText = "File updated successfully";

        // Update the list of updated files
        updateUpdatedFilesList();
        displayContent(fileContent, uploaderAddress);
      }
    } catch (err) {
      console.error("The connection to the contract error:", err);
      alert("Error updating file hash");
    }
  }
}



function updateUpdatedFilesList() {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = ''; // Clear existing table

  // Create header row
  const headerRow = document.createElement('tr');
  const headers = ['ID', 'URL', 'Uploader', 'Date', 'Hour'];
  headers.forEach(headerText => {
    const header = document.createElement('th');
    header.textContent = headerText;
    headerRow.appendChild(header);
  });
  fileList.appendChild(headerRow);

  // Create data rows
  updatedFiles.forEach((file, index) => {
    const row = document.createElement('tr');

    // Create cells
    const idCell = document.createElement('td');
    idCell.textContent = index + 1; // Use index as ID
    const urlCell = document.createElement('td');
    urlCell.textContent = file.url;
    const uploaderCell = document.createElement('td');
    uploaderCell.textContent = file.uploader;
    const dateCell = document.createElement('td');
    dateCell.textContent = file.date; // Display the date
    const hourCell = document.createElement('td');
    hourCell.textContent = file.hour; // Display the hour

    // Append cells to the row
    row.appendChild(idCell);
    row.appendChild(urlCell);
    row.appendChild(uploaderCell);
    row.appendChild(dateCell);
    row.appendChild(hourCell);

    // Append row to the table
    fileList.appendChild(row);
  });
}






async function verifyIntegrity() {
  let newFileContent = FileContent;
  let fileName2 = FileName;

  if (fileName2 == "") {
    document.getElementById("result").innerText = "Please choose a file and extract its content!";
  } else {
    try {
      const contract = await connectWallet();
      if (contract) {
        const verifyIntegrity = await contract.checkDataIntegrity(fileName2, newFileContent);
        const [, uploaderAddress] = verifyIntegrity;

        displayContent(newFileContent, uploaderAddress);
        document.getElementById("result").innerText = verifyIntegrity[0];
      }
    } catch (err) {
      console.error("The connection to the contract error:", err);
    }
  }
}

document.getElementById('deployButton').addEventListener('click', updateFileHash);
document.getElementById('verifyButton').addEventListener('click', verifyIntegrity);
document.getElementById('uploadAndExtract').addEventListener('click', uploadAndExtract);