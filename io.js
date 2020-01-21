/*********************************
*  FZ/KM web written by Katsumi  *
*    This script is released     *
*       under the GPL v2.0       *
*********************************/

/*
	Public methods:
	io.read(addrL,addrH);
	io.write(addrL,addrH,data);
*/
io=new Object();
io.keypress=0;
io.timer8=0;
io.init=function(){
	io.RAM_ROM=0;
	io.ROM_A14=0;
	io.ROM_A15=0;
};
io.init();
io.read=function(addrL,addrH){
	var ret;
	if (0x00<=addrL && addrL<=0x07) {
		// SIO
		switch(addrL&0x03){
			case 0x00:
			case 0x01:
				ret=io.keypress;
				io.keypress=0;
				return ret;
			case 0x02:
			case 0x03:
				return 0x06|(io.keypress ? 1:0)|(io.timer8 ? 8:0);
		}
	} else if (0x10<=addrL && addrL<=0x17) {
		// IDE
		//console.log('IN 0x'+addrL.toString(16));
		return ide.ide_read(addrL&7);
	} else if (0x38<=addrL && addrL<=0x3F) {
		// Latch
	}
	return 0;
};
io.write=function(addrL,addrH,data){
	if (0x00<=addrL && addrL<=0x07) {
		// SIO
		switch(addrL&0x03){
			case 0x00:
				// SIOA_D
			case 0x01:
				// SIOB_D
				display.writeChar(data);
				break;
		}
	} else if (0x10<=addrL && addrL<=0x17) {
		// IDE
		//console.log('OUT 0x'+addrL.toString(16)+', 0x'+data.toString(16));
		ide.ide_write(addrL&7,data);
	} else if (0x38<=addrL && addrL<=0x3F) {
		// Latch
		switch(addrL){
			case 0x38:
				io.RAM_ROM=data&1;
				break;
			case 0x3E:
				io.ROM_A15=data&1;
				break;
			case 0x3F:
				io.ROM_A14=data&1;
				break;
		}
	} else {
		console.log("OUT 0x"+(addrH*256+addrL).toString(16)+",0x"+data.toString(16)+
			"(0xB"+(0xF800000 | ((addrL&0x40)<<13 | ((addrH&0xff)<<8) | ((addrL&0x3f)<<2))).toString(16)+")" );
	}
};
io.keydown=function(key,shift,ctrl){//console.log(key);
	if (64<key && key<91) {
		// A-Z
		if (ctrl) {
			this.keypress=key-64;
		} else {
			this.keypress=key+(shift ? 0:32);
		}
	} else if (0x30<=key && key<=0x39 && shift) {
		// Shift + 0-9
		this.keypress=")!@#$%^&*(".charCodeAt(key-0x30);
	} else if (key==0x10 || key==0x11 || key==0x14) {
		// Shift, Ctrl, and Caps-Lock key
	} else if (shift) {
		switch(key) {
			case 173: //_
			case 189:
				this.keypress="_".charCodeAt(0);
				break;
			case 61:  //+
			case 187:
				this.keypress="+".charCodeAt(0);
				break;
			case 219: //{
				this.keypress="{".charCodeAt(0);
				break;
			case 221: //}
				this.keypress="}".charCodeAt(0);
				break;
			case 220: //|
				this.keypress="|".charCodeAt(0);
				break;
			case 59:  //:
			case 186:
				this.keypress=":".charCodeAt(0);
				break;
			case 222: //"
				this.keypress='"'.charCodeAt(0);
				break;
			case 188: //<
				this.keypress="<".charCodeAt(0);
				break;
			case 190: //>
				this.keypress=">".charCodeAt(0);
				break;
			case 191: //?
				this.keypress="?".charCodeAt(0);
				break;
			case 192: //~
				this.keypress="~".charCodeAt(0);
				break;
			default:
				this.keypress=key;
				break;
		}
	} else {//alert(key);
		switch(key) {
			case 173: //-
			case 189:
				this.keypress="-".charCodeAt(0);
				break;
			case 61:  //=
			case 187:
				this.keypress="=".charCodeAt(0);
				break;
			case 59:  //;
			case 186:
				this.keypress=";".charCodeAt(0);
				break;
			case 222: //'
				this.keypress="'".charCodeAt(0);
				break;
			case 188: //,
				this.keypress=",".charCodeAt(0);
				break;
			case 190: //.
				this.keypress=".".charCodeAt(0);
				break;
			case 191: ///
				this.keypress="/".charCodeAt(0);
				break;
			case 192: //`
				this.keypress="`".charCodeAt(0);
				break;
			case 219: //[
				this.keypress="[".charCodeAt(0);
				break;
			case 221: //]
				this.keypress="]".charCodeAt(0);
				break;
			case 220: //\
				this.keypress="\\".charCodeAt(0);
				break;
			default:
				this.keypress=key;
				break;
		}
	}
	// Interrupt
	// 0xE0 is used as dummy interrupt vector.
	// This would be valid only for "IM 2".
	// However, "IM 1" is used in Fuzix.
	z80.interrupt(0xE0);
}
io.keyup=function(key,shift,ctrl){

};
io.timer=function(time){
	// 8 Hz timer
	time=time % 125;
	// To binary
	time=(time<62) ? 1:0;
	// Interrupt if required
	if (io.timer8!=time) {
		io.timer8=time;
		z80.interrupt(0xE0);
	} else {
		io.timer8=time;
	}
};
