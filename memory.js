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
memory.ram=Array(0xe000); // 56 KB RAM
memory.priorities=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
memory.pointers=[
	0x0000,
	0x1000,
	0x2000,
	0x3000,
	0x4000,
	0x5000,
	0x6000,
	0x7000,
	0x8000,
	0x9000,
	0xa000,
	0xb000,
	0xc000,
	0xd000,
	-1,
	-1,
];
memory.swap=new Array(3);
memory.swap[0]=new Object();
memory.swap[0].data=new Array(4096);
memory.swap[0].bank=0x0e;
memory.swap[1]=new Object();
memory.swap[1].data=new Array(4096);
memory.swap[1].bank=0x0f;
memory.swap[2]=new Object();
memory.swap[2].data=new Array(4096);
memory.swap[2].bank=-1;
memory.init=function(){
	// All 64 kbytes are assigned to RAM
	var i;
	for (i=0;i<0xe000;i++) {
		this.ram[i]=0;
	}
	for (i=0;i<0x1000;i++) {
		this.swap[0].data[i]=0;
		this.swap[1].data[i]=0;
		this.swap[2].data[i]=0;
	}
};
memory.read=function(addr){
	addr&=0xffff;
	if (0x4000<=addr || io.RAM_ROM) {
		return this.readRAM(addr);
	} else {
		if (io.ROM_A14) addr+=0x4000;
		if (io.ROM_A15) addr+=0x8000;
		return this.rom[addr];
	}
};
memory.write=function(addr,data){
	addr&=0xffff;
	data&=0xff;
	this.writeRAM(addr,data);
};
memory.readRAM=function(addr){
	var bank=addr>>12;
	this.priorities[bank]++;
	if (this.pointers[bank]<0) this.swapData(bank);
	return this.ram[this.pointers[bank]+(addr&0x0fff)];
};
memory.writeRAM=function(addr,data){
	var bank=addr>>12;
	this.priorities[bank]++;
	if (this.pointers[bank]<0) this.swapData(bank);
	this.ram[this.pointers[bank]+(addr&0x0fff)]=data;
};
memory.swapData=function(bank){
	var i;
	var swap;
	var fnum;
	var min=0xffffffff;
	var ramp;
	// Determine whick bank to be stored in disk
	for(i=0;i<16;i++){
		this.priorities[i]/=2;
		if (bank==i) continue;
		if (this.pointers[i]<0) continue;
		if (this.priorities[i]<min) {
			swap=i;
			min=this.priorities[i];
		}
	}
	// Detemine file number to use to store
	for(fnum=0;fnum<2;fnum++){
		if (this.swap[fnum].bank<0) break;
	}
	// Store RAM to disk
	this.swap[fnum].bank=swap;
	ramp=this.pointers[swap];
	this.pointers[swap]=-1;
	for(i=0;i<4096;i++){
		this.swap[fnum].data[i]=this.ram[ramp++];
	}
	// Detemine file number to use to pick up
	for(fnum=0;fnum<2;fnum++){
		if (this.swap[fnum].bank==bank) break;
	}
	// Recall RAM from disk
	this.swap[fnum].bank=-1;
	ramp-=4096;
	this.pointers[bank]=ramp;
	for(i=0;i<4096;i++){
		this.ram[ramp++]=this.swap[fnum].data[i];
	}
}
