// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VerifyDataIntegrity {

    address public admin;

    // Struct to store information about uploaded files
    struct FileInfo {
        bytes32 fileHash;
        address uploader;
    }

    // Mapping to store file information based on URL
    mapping(string => FileInfo) internal fileInformation;

    // Array to store list of file URLs
    string[] internal fileURLs;

    // Mapping to track file existence
    mapping(string => bool) internal fileExists;

    event FileHashUpdated(string indexed url, bytes32 fileHash, address indexed uploader);

    constructor() {
        admin = msg.sender;  
    } 

    // The Hashing Function
    function hash(string memory content) internal pure returns (bytes32) {
        return keccak256(bytes(content));
    } 
    function getFileHash(string memory _url) public view returns (bytes32) {
        require(doesFileExist(_url), "File does not exist");
        return fileInformation[_url].fileHash;
    }

    // Function to update file hash and record uploader's address
    function updateFileHash(string memory _url, string memory _content) public {
        require(msg.sender == admin, "You don't have access to update the files hashes");

        bytes32 newHash = hash(_content);

        if (fileExists[_url]) {
            // Update the file hash if the file already exists
            fileInformation[_url].fileHash = newHash;
            emit FileHashUpdated(_url, newHash, msg.sender);
        } else {
            // Add a new file if it doesn't exist
            fileInformation[_url] = FileInfo({
                fileHash: newHash,
                uploader: msg.sender
            });
            // Set file existence to true
            fileExists[_url] = true;
            // Add the new URL to the fileURLs array
            fileURLs.push(_url);
            emit FileHashUpdated(_url, newHash, msg.sender);
        }
    }

    // Function to check file existence
    function doesFileExist(string memory _url) public view returns (bool) {
        return fileInformation[_url].uploader != address(0);
    }

    // Function to get all file URLs
    function getAllFileURLs() public view returns (string[] memory) {
        return fileURLs;
    }

    // Function to check file content integrity and get uploader's address
    function checkDataIntegrity(string memory _url, string memory _newContent) public view returns (string memory, address) {
        if (!doesFileExist(_url)) {
            return ("This URL is invalid, check the uploaded file and try again", address(0));
        }

        bytes32 currentHash = fileInformation[_url].fileHash;
        bytes32 newHash = hash(_newContent);

        if (currentHash == newHash) {
            return ("!!! Content isn't modified!!!", fileInformation[_url].uploader);
        } else {
            return ("Content has been modified!!", fileInformation[_url].uploader);
        }
    }
}
