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
				return 0x04|(io.keypress ? 3:0);
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
	}
};
io.keydown=function(key,shift,ctrl){
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
				this.keypress="_".charCodeAt(0);
				break;
			case 61:  //+
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
			default:
				this.keypress=key;
				break;
		}
	}
	// Interrupt
	z80.interrupt(0);
}
io.keyup=function(key,shift,ctrl){

};
