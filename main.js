/*********************************
*  FZ/KM web written by Katsumi  *
*    This script is released     *
*       under the GPL v2.0       *
*********************************/

// Initialize Z80 CPU
var speed=2000000; // 2 Mhz
var maxspeed=speed;
z80.setSpeed(speed);
z80.reset();
z80.events=function(){
	// z80.events() will be called every msec.
}
// Initialize Memory
memory.init();
// Initialize ROM
//memory.initrom();
// Additional initializations
if (get.debug && typeof debugDisplay !="undefined") {
	dom.showDebug();
	if (get.break) {
		z80.breakPoint=parseInt(get.break,16);
	}
}
// Following function will be called by initializing display.
start=function(){
	var time;
	time=new Date().getTime();
	setTimeout(function(){
			var from=time;
			var to=time=new Date().getTime();
			var msec=to-from;
			if (msec<50 && speed<maxspeed) {
				speed<<=1;
				 if (15625<speed && speed<31250) speed=15625;
				z80.setSpeed(speed);
				dom.showSpeed(speed);
			} else if (100<msec) {
				speed>>=1;
				if (speed<1) speed=1;
				z80.setSpeed(speed);
				dom.showSpeed(speed);
			}
			z80.exec(msec);
			if (z80.step) {
				showRegisters();
			} else {
				setTimeout(arguments.callee,10);
			}
		},10);
};

