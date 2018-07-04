var fs = require('fs');
var fileName = './20180622001.mp3';
var RateLimiter = require('limiter').RateLimiter;
var fileBuf = fs.readFileSync(fileName);
console.log("file total size "+ fileBuf.length);
//读取头
var header = fileBuf.slice(0,24);
console.log(header);
var contentLength = header.readUIntBE(8,4);
console.log("content total length " + contentLength);

var totalPacket = header.readUIntBE(12,4);
console.log("total packet  size " + totalPacket);

var contentMs = header.readUIntBE(16,4);
console.log("content Ms length " + contentMs);


var bufferStartIndex = contentLength+24;
var packetBuffer = fileBuf.slice(bufferStartIndex);
var totalPackageSize = 0
var packetLenArr = []
//读取每个包的长度
for (i=0; i<totalPacket; i++) {
    var packetSize = packetBuffer.readUIntBE(i*2,2);
    totalPackageSize = totalPackageSize + packetSize
    packetLenArr.push(packetSize)
}
 
//print packetPer conent 测试
var content = fileBuf.slice(24,contentLength+24);
console.log("content.length:"+content.length);



var serverHost = "你的IP地址";
var serverPort = 6002;

var net = require('net');

var seed_code = "SEED编码";
var client = new net.Socket();
client.connect(serverPort, serverHost, function() {
    console.log('Connected');
    console.log('CONNECTED TO:' + serverHost + ':' + serverPort);
    json_content = '{"cmd":"PLAYLIST","ulevel":99,"plevel":2,"Umask":"test","Umagic":3,"snlist":["'+seed_code+'"]}';
    json_len = json_content.length
    client.write(json_len.toString()+'\n'+json_content);
    // client.write(content.slice(0,packetLenArr[0]));
});
var t;
var j = 0; 
totalPackageSize = 0;
function  fuck_data(){
    var packetSize = packetLenArr[j];
	
    console.log("index " + totalPackageSize + " packetSize " + packetSize ); 
		//var packetContent = Buffer.from(content.buffer,totalPackageSize,packetSize);
		
		var packetContent = content.slice(totalPackageSize,packetSize+totalPackageSize);
		console.log(content.length+" "+packetContent.length);
    totalPackageSize = totalPackageSize + packetSize;
	
	if(client.write(packetContent)){
		console.log("Write Over");
	}else{
		clearInterval(t);
	}
	 
	j++; 
	if(j >= totalPacket ){
		 clearInterval(t);
	}
}
client.on('data', function(data) {
    console.log('Received: '+ data);
	if(data == "WELL"){
		t = setInterval(fuck_data,contentMs);
		console.log("content wait for send"+content.length);	
	}  
});

client.on('close', function() {
    console.log('Connection closed');
	clearInterval(t);
});
client.on('error', function(err) {
    console.error('Socket error: ' + err );
    console.error(new Error().stack);
	clearInterval(t);
});
