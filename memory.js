/*********************************
*  FZ/KM web written by Katsumi  *
*    This script is released     *
*       under the GPL v2.0       *
*********************************/

/*
	Public methods:
	memory.read(addr);
	memory.write(addr,data);
	memory.init();
	memory.load();
*/
memory=new Object();
memory.ram=Array(0x10000); // 64 KB RAM
memory.userom=true;
memory.useram=function(use){
	memory.userom=use ? false:true;
};
memory.init=function(){
	// All 64 kbytes are assigned to RAM
	var i;
	for (i=0;i<0x10000;i++) {
		this.ram[i]=0;
	}
};
memory.read=function(addr){
	addr&=0xffff;
	if (0x4000<=addr || io.RAM_ROM) {
		return this.ram[addr];
	} else {
		if (io.ROM_A14) addr+=0x4000;
		if (io.ROM_A15) addr+=0x8000;
		return this.rom[addr];
	}
};
memory.write=function(addr,data){
	addr&=0xffff;
	data&=0xff;
	this.ram[addr]=data;
};
memory.load=function(data){
	var i;
	// Copy data to RAM from 0x0100
	for(i=0;i<data.length;i++){
		this.ram[0x0100+i]=data[i];
	}
	// File length must be 128 byte blocks.
	// Fill 0x00 at the end if required.
	for(;i<128*parseInt((data.length+127)/128);i++){
		this.ram[0x0100+i]=0x00;
	}
}
