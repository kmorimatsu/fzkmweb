/*
 *	IDE Emulation Layer for retro-style PIO interfaces
 *
 *	(c) Copyright Alan Cox, 2015-2019
 *
 *	IDE-emu is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 2 of the License, or
 *	(at your option) any later version.
 *
 *	IDE-emu is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with IDE-emu.  If not, see <http://www.gnu.org/licenses/>.
 */

/*********************************
*  FZ/KM web written by Katsumi  *
*    This script is released     *
*       under the GPL v2.0       *
*********************************/

/*
 * The ide.c and ide.h were fetched from https://github.com/EtchedPixels/RC2014
 * Translation to JavaScript is done by Katsumi.
 */


/*
 * Public functions:
 *
 *   ide.init(data);
 *     data: an array containing disk image data
 *   ide.ide_read(r);
 *     r: CF register to read
 *   ide.ide_write(r,v);
 *     r: CF register to write
 *     v: 8 bit value
 */

ide=new Object();
ide.disk=0;
ide.init=function(data){
	// "data" is the array containing disk image file
	ide.disk=new Object();
	ide.disk.data=data;
	ide.disk.point=0;
	ide.disk.len=data.length;
	// Construct structures
	ide.structures();
};
ide.ide_read=function(r){
	// If disk image is uploaded, emulate it
	if (ide.disk) return ide.ide_read8(ide.ide0,r);
	// If not, show warning.
	var str="\r\n\r\nWaiting for loading disk image file, tomssbc-0.3.ide\r\n\r\n";
	var i;
	for(i=0;i<str.length;i++){
		display.writeChar(str.charCodeAt(i));
	}
	return 0;
};
ide.ide_write=function(r,v){
	if (!ide.disk) return;
	ide.ide_write8(ide.ide0,r,v);
};
ide.memcpy=function(dst,src,len){
	var i;
	for(i=0;i<len;i++) dst[i]=src[i];
};
ide.lseek=function(handle,point){
	// The handle is dummy. Only a file is used to open.
	if (point<0 || ide.disk.len<point) return -1;
	ide.disk.point=point;
	return 0;
};
ide.read=function(handle,data,len){
	var i;
	if (len<0 || ide.disk.len<ide.disk.point) return 0;
	if (ide.disk.len<ide.disk.point+len) len=ide.disk.len-ide.disk.point;
	for(i=0;i<len;i++){
		data[i]=ide.disk.data[ide.disk.point++];
	}
	return len;
};
ide.write=function(handle,data,len){
	var i;
	if (len<0 || ide.disk.len<ide.disk.point) return 0;
	if (ide.disk.len<ide.disk.point+len) len=ide.disk.len-ide.disk.point;
	for(i=0;i<len;i++){
		ide.disk.data[ide.disk.point++]=data[i];
	}
	return len;
};

//#include <stdio.h>
//#include <stdint.h>
//#include <unistd.h>
//#include <string.h>
//#include <stdlib.h>
//#include <errno.h>
//#include <time.h>
//#include <arpa/inet.h>
//
//#include "ide.h"

/*
 * Constants follow
 */
 
ide.IDE_IDLE=0;
ide.IDE_CMD=1;
ide.IDE_DATA_IN=2;
ide.IDE_DATA_OUT=3;

ide.DCR_NIEN=2;
ide.DCR_SRST=4;

ide.DEVH_HEAD=15;
ide.DEVH_DEV=16;
ide.DEVH_LBA=64;

ide.ERR_AMNF=1;
ide.ERR_TKNONF=2;
ide.ERR_ABRT=4;
ide.ERR_MCR=8;
ide.ERR_IDNF=16;
ide.ERR_MC=32;
ide.ERR_UNC=64;

ide.ST_ERR=1;
ide.ST_IDX=2;
ide.ST_CORR=4;
ide.ST_DRQ=8;
ide.ST_DSC=16;
ide.ST_DF=32;
ide.ST_DRDY=64;
ide.ST_BSY=128;

ide.DCL_SRST=4;
ide.DCL_NIEN=2;

ide.IDE_CMD_CALIB=0x10;
ide.IDE_CMD_READ=0x20;
ide.IDE_CMD_READ_NR=0x21;
ide.IDE_CMD_WRITE=0x30;
ide.IDE_CMD_WRITE_NR=0x31;
ide.IDE_CMD_VERIFY=0x40;
ide.IDE_CMD_VERIFY_NR=0x41;
ide.IDE_CMD_SEEK=0x70;
ide.IDE_CMD_EDD=0x90;
ide.IDE_CMD_INTPARAMS=0x91;
ide.IDE_CMD_IDENTIFY=0xEC;
ide.IDE_CMD_SETFEATURES=0xEF;

ide.ide_data=0;
ide.ide_error_r=1;
ide.ide_feature_w=1;
ide.ide_sec_count=2;
ide.ide_sec_num=3;
ide.ide_lba_low=3;
ide.ide_cyl_low=4;
ide.ide_lba_mid=4;
ide.ide_cyl_hi=5;
ide.ide_lba_hi=5;
ide.ide_dev_head=6;
ide.ide_lba_top=6;
ide.ide_status_r=7;
ide.ide_command_w=7;
ide.ide_altst_r=8;
ide.ide_devctrl_w=8;
ide.ide_data_latch=9;

/*
 * Functions follow
 */

//static char *charmap(uint8_t v)
//{
//  static char cbuf[3];
//  if (v < 32)
//    sprintf(cbuf, "^%c", '@'+v);
//  else if (v < 127)
//    sprintf(cbuf, " %c", v);
//  else if (v == 127)
//    sprintf(cbuf, "DL");
//  else if (v < 160)
//    sprintf(cbuf, ":%c", '@' + v - 128);
//  else if (v < 255)
//    sprintf(cbuf, "~%c", v - 128);
//  else
//    sprintf(cbuf, "!D");
//  return cbuf;
//}
//
//static void hexdump(uint8_t *bp)
//{
//  int i,j;
//  for (i = 0; i < 512; i+= 16) {
//    for(j = 0; j < 16; j++)
//      fprintf(stderr, "%02X ", bp[i+j]);
//    fprintf(stderr, "|");
//    for(j = 0; j < 16; j++)
//      fprintf(stderr, "%2s", charmap(bp[i+j]));
//    fprintf(stderr, "\n");
//  }
//}
//
///* FIXME: use proper endian convertors! */
//static uint16_t le16(uint16_t v)
//{
//  uint8_t *p = (uint8_t *)&v;
//  return p[0] | (p[1] << 8);
//}
//
//static void ide_xlate_errno(struct ide_taskfile *t, int len)
//{
//  t->status |= ST_ERR;
//  if (len == -1) {
//    if (errno == EIO)
//      t->error = ERR_UNC;
//    else
//      t->error = ERR_AMNF;
//  } else
//    t->error = ERR_AMNF;
//}
ide.ide_xlate_errno=function(t,len){
  t.status |= ide.ST_ERR;
  t.error = ide.ERR_AMNF;
};

//static void ide_fault(struct ide_drive *d, const char *p)
//{
//  fprintf(stderr, "ide: %s: %d: %s\n", d->controller->name,
//			(int)(d - d->controller->drive), p);
//}
ide.ide_fault=function(d,p){
  console.log("ide: "+d.controller.name+": "+d.controller.drive+": "+p);
};

///* Disk translation */
//static off_t xlate_block(struct ide_taskfile *t)
//{
//  struct ide_drive *d = t->drive;
//  uint16_t cyl;
//
//  if (t->lba4 & DEVH_LBA) {
///*    fprintf(stderr, "XLATE LBA %02X:%02X:%02X:%02X\n", 
//      t->lba4, t->lba3, t->lba2, t->lba1);*/
//    if (d->lba)
//      return 2 + (((t->lba4 & DEVH_HEAD) << 24) | (t->lba3 << 16) | (t->lba2 << 8) | t->lba1);
//    ide_fault(d, "LBA on non LBA drive");
//  }
//
//  /* Some well known software asks for 0/0/0 when it means 0/0/1. Drives appear
//     to interpret sector 0 as sector 1 */
//  if (t->lba1 == 0) {
//    fprintf(stderr, "[Bug: request for sector offset 0].\n");
//    t->lba1 = 1;
//  }
//  cyl = (t->lba3 << 8) | t->lba2;
//  /* fprintf(stderr, "(H %d C %d S %d)\n", t->lba4 & DEVH_HEAD, cyl, t->lba1); */
//  if (t->lba1 == 0 || t->lba1 > d->sectors || t->lba4 >= d->heads || cyl >= d->cylinders) {
//    return -1;
//  }
//  /* Sector 1 is first */
//  /* Images generally go cylinder/head/sector. This also matters if we ever
//     implement more advanced geometry setting */
//  return 1 + ((cyl * d->heads) + (t->lba4 & DEVH_HEAD)) * d->sectors + t->lba1;
//}
ide.xlate_block=function(t){
  var d = t.drive;
  var cyl;

  if (t.lba4 & ide.DEVH_LBA) {
    if (d.lba)
      return 2 + (((t.lba4 & ide.DEVH_HEAD) << 24) | (t.lba3 << 16) | (t.lba2 << 8) | t.lba1);
    ide.ide_fault(d, "LBA on non LBA drive");
  }

  /* Some well known software asks for 0/0/0 when it means 0/0/1. Drives appear
     to interpret sector 0 as sector 1 */
  if (t.lba1 == 0) {
    console.log("[Bug: request for sector offset 0].");
    t.lba1 = 1;
  }
  cyl = (t.lba3 << 8) | t.lba2;
  if (t.lba1 == 0 || t.lba1 > d.sectors || t.lba4 >= d.heads || cyl >= d.cylinders) {
    return -1;
  }
  return 1 + ((cyl * d.heads) + (t.lba4 & ide.DEVH_HEAD)) * d.sectors + t.lba1;
};

//
///* Indicate the drive is ready */
//static void ready(struct ide_taskfile *tf)
//{
//  tf->status &= ~(ST_BSY|ST_DRQ);
//  tf->status |= ST_DRDY;
//  tf->drive->state = IDE_IDLE;
//}
ide.ready=function(tf){
  tf.status &= ~(ide.ST_BSY|ide.ST_DRQ);
  tf.status |= ide.ST_DRDY;
  tf.drive.state = ide.IDE_IDLE;
};

//
///* Return to idle state, completing a command */
//static void completed(struct ide_taskfile *tf)
//{
//  ready(tf);
//  tf->drive->intrq = 1;
//}
ide.completed=function(tf){
  ide.ready(tf);
  tf.drive.intrq = 1;
};

//
//static void drive_failed(struct ide_taskfile *tf)
//{
//  tf->status |= ST_ERR;
//  tf->error = ERR_IDNF;
//  ready(tf);
//}
ide.drive_failed=function(tf){
  tf.status |= ide.ST_ERR;
  tf.error = ide.ERR_IDNF;
  ide.ready(tf);
};

//
//static void data_in_state(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  d->state = IDE_DATA_IN;
//  d->dptr = d->data + 512;
//  /* We don't clear DRDY here, drives may well accept a command at this
//     point and at least one firmware for RC2014 assumes this */
//  tf->status &= ~ST_BSY;
//  tf->status |= ST_DRQ;
//  d->intrq = 1;			/* Double check */
//}
ide.data_in_state=function(tf){
  var d = tf.drive;
  d.state = ide.IDE_DATA_IN;
  d.dptr = 512;
  tf.status &= ~ide.ST_BSY;
  tf.status |= ide.ST_DRQ;
  d.intrq = 1;			/* Double check */
};

//
//static void data_out_state(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  d->state = IDE_DATA_OUT;
//  d->dptr = d->data;
//  tf->status &= ~ (ST_BSY|ST_DRDY);
//  tf->status |= ST_DRQ;
//  d->intrq = 1;			/* Double check */
//}
ide.data_out_state=function(tf){
  var d = tf.drive;
  d.state = ide.IDE_DATA_OUT;
  d.dptr = 0;
  tf.status &= ~ (ide.ST_BSY|ide.ST_DRDY);
  tf.status |= ide.ST_DRQ;
  d.intrq = 1;			/* Double check */
};

//
//static void edd_setup(struct ide_taskfile *tf)
//{
//  tf->error = 0x01;		/* All good */
//  tf->lba1 = 0x01;		/* EDD always updates drive 0 */
//  tf->lba2 = 0x00;
//  tf->lba3 = 0x00;
//  tf->lba4 = 0x00;
//  tf->count = 0x01;
//  ready(tf);
//}
ide.edd_setup=function(tf){
  tf.error = 0x01;		/* All good */
  tf.lba1 = 0x01;		/* EDD always updates drive 0 */
  tf.lba2 = 0x00;
  tf.lba3 = 0x00;
  tf.lba4 = 0x00;
  tf.count = 0x01;
  ide.ready(tf);
};

//
//void ide_reset(struct ide_controller *c)
//{
//  if (c->drive[0].present) {
//    edd_setup(&c->drive[0].taskfile);
//    /* A drive could clear busy then set DRDY up to 2 minutes later if its
//       mindnumbingly slow to start up ! We don't emulate any of that */
//    c->drive[0].taskfile.status = ST_DRDY;
//    c->drive[0].eightbit = 0;
//  }
//  if (c->drive[1].present) {
//    edd_setup(&c->drive[1].taskfile);
//    c->drive[1].taskfile.status = ST_DRDY;
//    c->drive[1].eightbit = 0;
//  }
//  c->selected = 0;
//}
ide.ide_reset=function(c){
  if (c,drive[0].present) {
    ide.edd_setup(c.drive[0].taskfile);
    c.drive[0].taskfile.status = ide.ST_DRDY;
    c.drive[0].eightbit = 0;
  }
  if (c.drive[1].present) {
    ide.edd_setup(c.drive[1].taskfile);
    c.drive[1].taskfile.status = ide.ST_DRDY;
    c.drive[1].eightbit = 0;
  }
  c.selected = 0;
};

//
//void ide_reset_begin(struct ide_controller *c)
//{
//  if (c->drive[0].present)
//    c->drive[0].taskfile.status |= ST_BSY;
//  if (c->drive[1].present)
//    c->drive[1].taskfile.status |= ST_BSY;
//  /* Ought to be a time delay relative to reset or power on */
//  ide_reset(c);
//}
//
//static void ide_srst_begin(struct ide_controller *c)
//{
//  ide_reset(c);
//  if (c->drive[0].present)
//    c->drive[0].taskfile.status |= ST_BSY;
//  if (c->drive[1].present)
//    c->drive[1].taskfile.status |= ST_BSY;
//}  
ide.ide_srst_begin=function(c){
  ide.ide_reset(c);
  if (c.drive[0].present)
    c.drive[0].taskfile.status |= ide.ST_BSY;
  if (c.drive[1].present)
    c.drive[1].taskfile.status |= ide.ST_BSY;
};

//
//static void ide_srst_end(struct ide_controller *c)
//{
//  /* Could be time delays here */
//  ready(&c->drive[0].taskfile);
//  ready(&c->drive[1].taskfile);
//}
ide.ide_srst_end=function(c){
  ide.ready(c.drive[0].taskfile);
  ide.ready(c.drive[1].taskfile);
};

//
//static void cmd_edd_complete(struct ide_taskfile *tf)
//{
//  struct ide_controller *c = tf->drive->controller;
//  if (c->drive[0].present)
//    edd_setup(&c->drive[0].taskfile);
//  if (c->drive[1].present)
//    edd_setup(&c->drive[1].taskfile);
//  c->selected = 0;
//}
ide.cmd_edd_complete=function(tf){
  var c = tf.drive.controller;
  if (c.drive[0].present)
    ide.edd_setup(c.drive[0].taskfile);
  if (c.drive[1].present)
    ide.edd_setup(c.drive[1].taskfile);
  c.selected = 0;
};

//
//static void cmd_identify_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  memcpy(d->data, d->identify, 512);
//  data_in_state(tf);
//  /* Arrange to copy just the identify buffer */
//  d->dptr = d->data;
//  d->length = 1;
//}
ide.cmd_identify_complete=function(tf){
  var d = tf.drive;
  ide.memcpy(d.data, d.identify, 512);
  ide.data_in_state(tf);
  d.dptr = 0;
  d.length = 1;
};

//
//static void cmd_initparam_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  /* We only support the current mapping */
//  if (tf->count != d->sectors || (tf->lba4 & DEVH_HEAD) + 1 != d->heads) {
//    tf->status |= ST_ERR;
//    tf->error |= ERR_ABRT;
//    tf->drive->failed = 1;		/* Report ID NF until fixed */
//    fprintf(stderr, "geo is %d %d, asked for %d %d\n",
//      d->sectors, d->heads, tf->count, (tf->lba4 & DEVH_HEAD) + 1);
//    ide_fault(d, "invalid geometry");
//  } else if (tf->drive->failed == 1)
//    tf->drive->failed = 0;		/* Valid translation */
//  completed(tf);
//}
ide.cmd_initparam_complete=function(tf){
  var d = tf.drive;
  if (tf.count != d.sectors || (tf.lba4 & ide.DEVH_HEAD) + 1 != d.heads) {
    tf.status |= ide.ST_ERR;
    tf.error |= ide.ERR_ABRT;
    tf.drive.failed = 1;		/* Report ID NF until fixed */
    console.log("geo is "+d.sectors+" "+d.heads+", asked for "+tf.count+" "+((tf.lba4 & ide.DEVH_HEAD) + 1));
    ide.ide_fault(d, "invalid geometry");
  } else if (tf.drive.failed == 1)
    tf.drive.failed = 0;		/* Valid translation */
  ide.completed(tf);
};

//
//static void cmd_readsectors_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  /* Move to data xfer */
//  if (d->failed) {
//    drive_failed(tf);
//    return;
//  }
//  d->offset = xlate_block(tf);
//  /* DRDY is not guaranteed here but at least one buggy RC2014 firmware
//     expects it */
//  tf->status |= ST_DRQ | ST_DSC | ST_DRDY;
//  tf->status &= ~ST_BSY;
//  /* 0 = 256 sectors */
//  d->length = tf->count ? tf->count : 256;
//  /* fprintf(stderr, "READ %d SECTORS @ %ld\n", d->length, d->offset); */
//  if (d->offset == -1 ||  lseek(d->fd, 512 * d->offset, SEEK_SET) == -1) {
//    tf->status |= ST_ERR;
//    tf->status &= ~ST_DSC;
//    tf->error |= ERR_IDNF;
//    /* return null data */
//    completed(tf);
//    return;
//  }
//  /* do the xfer */
//  data_in_state(tf);
//}
ide.cmd_readsectors_complete=function(tf){
  var d = tf.drive;
  if (d.failed) {
    ide.drive_failed(tf);
    return;
  }
  d.offset = ide.xlate_block(tf);
  tf.status |= ide.ST_DRQ | ide.ST_DSC | ide.ST_DRDY;
  tf.status &= ~ide.ST_BSY;
  d.length = tf.count ? tf.count : 256;
  if (d.offset == -1 ||  ide.lseek(d.fd, 512 * d.offset) == -1) {
    tf.status |= ide.ST_ERR;
    tf.status &= ~ide.ST_DSC;
    tf.error |= ide.ERR_IDNF;
    ide.completed(tf);
    return;
  }
  ide.data_in_state(tf);
};

//
//static void cmd_verifysectors_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  /* Move to data xfer */
//  if (d->failed) {
//    drive_failed(tf);
//    return;
//  }
//  d->offset = xlate_block(tf);
//  /* 0 = 256 sectors */
//  d->length = tf->count ? tf->count : 256;
//  if (d->offset == -1 || lseek(d->fd, 512 * (d->offset + d->length - 1), SEEK_SET) == -1) {
//    tf->status &= ~ST_DSC;
//    tf->status |= ST_ERR;
//    tf->error |= ERR_IDNF;
//  }
//  tf->status |= ST_DSC;
//  completed(tf);
//}
ide.cmd_verifysectors_complete=function(tf){
  var d = tf,drive;
  if (d,failed) {
    ide.drive_failed(tf);
    return;
  }
  d.offset = ide.xlate_block(tf);
  d.length = tf.count ? tf.count : 256;
  if (d.offset == -1 || ide.lseek(d.fd, 512 * (d.offset + d.length - 1)) == -1) {
    tf.status &= ~ide.ST_DSC;
    tf.status |= ide.ST_ERR;
    tf.error |= ide.ERR_IDNF;
  }
  tf.status |= ide.ST_DSC;
  ide.completed(tf);
};

//
//static void cmd_recalibrate_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  if (d->failed)
//    drive_failed(tf);
//  if (d->offset == -1 || xlate_block(tf) != 0L) {
//    tf->status &= ~ST_DSC;
//    tf->status |= ST_ERR;
//    tf->error |= ERR_ABRT;
//  }
//  tf->status |= ST_DSC;
//  completed(tf);
//}
ide.cmd_recalibrate_complete=function(tf){
  var d = tf.drive;
  if (d.failed)
    ide.drive_failed(tf);
  if (d.offset == -1 || ide.xlate_block(tf) != 0) {
    tf.status &= ~ide.ST_DSC;
    tf.status |= ide.ST_ERR;
    tf.error |= ide.ERR_ABRT;
  }
  tf.status |= ide.ST_DSC;
  ide.completed(tf);
};

//
//static void cmd_seek_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  if (d->failed)
//    drive_failed(tf);
//  d->offset = xlate_block(tf);
//  if (d->offset == -1 || lseek(d->fd, 512 * d->offset, SEEK_SET) == -1) {
//    tf->status &= ~ST_DSC;
//    tf->status |= ST_ERR;
//    tf->error |= ERR_IDNF;
//  }
//  tf->status |= ST_DSC;
//  completed(tf);
//}
ide.cmd_seek_complete=function(tf){
  var d = tf.drive;
  if (d.failed)
    ide.drive_failed(tf);
  d.offset = ide.xlate_block(tf);
  if (d.offset == -1 || ide.lseek(d.fd, 512 * d.offset) == -1) {
    tf.status &= ~ide.ST_DSC;
    tf.status |= ide.ST_ERR;
    tf.error |= ide.ERR_IDNF;
  }
  tf.status |= ide.ST_DSC;
  ide.completed(tf);
};

//
//static void cmd_setfeatures_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  switch(tf->feature) {
//    case 0x01:
//      d->eightbit = 1;
//      break;
//    case 0x03:
//      if ((tf->count & 0xF0) >= 0x20) {
//        tf->status |= ST_ERR;
//        tf->error |= ERR_ABRT;
//      }
//      /* Silently accept PIO mode settings */
//      break;
//    case 0x81:
//      d->eightbit = 0;
//      break;
//    default:
//      tf->status |= ST_ERR;
//      tf->error |= ERR_ABRT;
//  }
//  completed(tf);
//}
ide.cmd_setfeatures_complete=function(tf){
  var d = tf.drive;
  switch(tf.feature) {
    case 0x01:
      d.eightbit = 1;
      break;
    case 0x03:
      if ((tf.count & 0xF0) >= 0x20) {
        tf.status |= ide.ST_ERR;
        tf.error |= ide.ERR_ABRT;
      }
      /* Silently accept PIO mode settings */
      break;
    case 0x81:
      d.eightbit = 0;
      break;
    default:
      tf.status |= ide.ST_ERR;
      tf.error |= ide.ERR_ABRT;
  }
  ide.completed(tf);
};

//
//static void cmd_writesectors_complete(struct ide_taskfile *tf)
//{
//  struct ide_drive *d = tf->drive;
//  /* Move to data xfer */
//  if (d->failed) {
//    drive_failed(tf);
//    return;
//  }
//  d->offset = xlate_block(tf);
//  tf->status |= ST_DRQ;
//  /* 0 = 256 sectors */
//  d->length = tf->count ? tf->count : 256;
///*  fprintf(stderr, "WRITE %d SECTORS @ %ld\n", d->length, d->offset); */
//  if (d->offset == -1 ||  lseek(d->fd, 512 * d->offset, SEEK_SET) == -1) {
//    tf->status |= ST_ERR;
//    tf->error |= ERR_IDNF;
//    tf->status &= ~ST_DSC;
//    /* return null data */
//    completed(tf);
//    return;
//  }
//  /* do the xfer */
//  data_out_state(tf);
//}
ide.cmd_writesectors_complete=function(tf){
  var d = tf.drive;
  if (d.failed) {
    ide.drive_failed(tf);
    return;
  }
  d.offset = ide.xlate_block(tf);
  tf.status |= ide.ST_DRQ;
  d.length = tf.count ? tf.count : 256;
  if (d.offset == -1 ||  ide.lseek(d.fd, 512 * d.offset) == -1) {
    tf.status |= ide.ST_ERR;
    tf.error |= ide.ERR_IDNF;
    tf.status &= ~ide.ST_DSC;
    ide.completed(tf);
    return;
  }
  ide.data_out_state(tf);
};

//
//static void ide_set_error(struct ide_drive *d)
//{
//  d->taskfile.lba4 &= ~DEVH_HEAD;
//
//  if (d->taskfile.lba4 & DEVH_LBA) {
//    d->taskfile.lba1 = d->offset & 0xFF;
//    d->taskfile.lba2 = (d->offset >> 8) & 0xFF;
//    d->taskfile.lba3 = (d->offset >> 16) & 0xFF;
//    d->taskfile.lba4 |= (d->offset >> 24) & DEVH_HEAD;
//  } else {
//    d->taskfile.lba1 = d->offset % d->sectors + 1;
//    d->offset /= d->sectors;
//    d->taskfile.lba4 |= d->offset / (d->cylinders * d->sectors);
//    d->offset %= (d->cylinders * d->sectors);
//    d->taskfile.lba2 = d->offset & 0xFF;
//    d->taskfile.lba3 = (d->offset >> 8) & 0xFF;
//  }
//  d->taskfile.count = d->length;
//  d->taskfile.status |= ST_ERR;
//  d->state = IDE_IDLE;
//  completed(&d->taskfile);
//}
ide.ide_set_error=function(d){
  d.taskfile.lba4 &= ~ide.DEVH_HEAD;

  if (d.taskfile.lba4 & ide.DEVH_LBA) {
    d.taskfile.lba1 = d.offset & 0xFF;
    d.taskfile.lba2 = (d.offset >> 8) & 0xFF;
    d.taskfile.lba3 = (d.offset >> 16) & 0xFF;
    d.taskfile.lba4 |= (d.offset >> 24) & ide.DEVH_HEAD;
  } else {
    d.taskfile.lba1 = d.offset % d.sectors + 1;
    d.offset /= d.sectors;
    d.taskfile.lba4 |= d.offset / (d.cylinders * d.sectors);
    d.offset %= (d.cylinders * d.sectors);
    d.taskfile.lba2 = d.offset & 0xFF;
    d.taskfile.lba3 = (d.offset >> 8) & 0xFF;
  }
  d.taskfile.count = d.length;
  d.taskfile.status |= ide.ST_ERR;
  d.state = ide.IDE_IDLE;
  ide.completed(d.taskfile);
};

//
//static int ide_read_sector(struct ide_drive *d)
//{
//  int len;
//
//  d->dptr = d->data;
//  if ((len = read(d->fd, d->data, 512)) != 512) {
//    perror("ide_read_sector");
//    d->taskfile.status |= ST_ERR;
//    d->taskfile.status &= ~ST_DSC;
//    ide_xlate_errno(&d->taskfile, len);
//    return -1;
//  }
////  hexdump(d->data);
//  d->offset += 512;
//  return 0;
//}
ide.ide_read_sector=function(d){
  var len;
  d.dptr = 0;
  if ((len = ide.read(d.fd, d.data, 512)) != 512) {
    ide.perror("ide_read_sector");
    d.taskfile.status |= ide.ST_ERR;
    d.taskfile.status &= ~ide.ST_DSC;
    ide.ide_xlate_errno(d.taskfile, len);
    return -1;
  }
  d.offset += 512;
  return 0;
};

//
//static int ide_write_sector(struct ide_drive *d)
//{
//  int len;
//
//  d->dptr = d->data;
//  if ((len = write(d->fd, d->data, 512)) != 512) {
//    d->taskfile.status |= ST_ERR;
//    d->taskfile.status &= ~ST_DSC;
//    ide_xlate_errno(&d->taskfile, len);
//    return -1;
//  }
////  hexdump(d->data);
//  d->offset += 512;
//  return 0;
//}
ide.ide_write_sector=function(d){
  var len;
  d.dptr = 0;
  if ((len = ide.write(d.fd, d.data, 512)) != 512) {
    d.taskfile.status |= ide.ST_ERR;
    d.taskfile.status &= ~ide.ST_DSC;
    ide.ide_xlate_errno(d.taskfile, len);
    return -1;
  }
  d.offset += 512;
  return 0;
};

//
//static uint16_t ide_data_in(struct ide_drive *d, int len)
//{
//  uint16_t v;
//  if (d->state == IDE_DATA_IN) {
//    if (d->dptr == d->data + 512) {
//      if (ide_read_sector(d) < 0) {
//        ide_set_error(d);	/* Set the LBA or CHS etc */
//        return 0xFFFF;		/* and error bits set by read_sector */
//      }
//    }
//    v = *d->dptr;
//    if (!d->eightbit) {
//      if (len == 2)
//        v |= (d->dptr[1] << 8);
//      d->dptr+=2;
//    } else
//      d->dptr++;
//    d->taskfile.data = v;
//    if (d->dptr == d->data + 512) {
//      d->length--;
//      d->intrq = 1;		/* we don't yet emulate multimode */
//      if (d->length == 0) {
//        d->state = IDE_IDLE;
//        completed(&d->taskfile);
//      }
//    }
//  } else
//    ide_fault(d, "bad data read");
//
//  if (len == 1)
//    return d->taskfile.data & 0xFF;
//  return d->taskfile.data;
//}
ide.ide_data_in=function(d,len){
  var v;
  if (d.state == ide.IDE_DATA_IN) {
    if (d.dptr == 512) {
      if (ide.ide_read_sector(d) < 0) {
        ide.ide_set_error(d);	/* Set the LBA or CHS etc */
        return 0xFFFF;		/* and error bits set by read_sector */
      }
    }
    v = d.data[d.dptr];
    if (!d.eightbit) {
      if (len == 2)
        v |= (d.data[d.dptr+1] << 8);
      d.dptr+=2;
    } else
      d.dptr++;
    d.taskfile.data = v;
    if (d.dptr == 512) {
      d.length--;
      d.intrq = 1;		/* we don't yet emulate multimode */
      if (d.length == 0) {
        d.state = ide.IDE_IDLE;
        ide.completed(d.taskfile);
      }
    }
  } else
    ide.ide_fault(d, "bad data read");

  if (len == 1)
    return d.taskfile.data & 0xFF;
  return d.taskfile.data;
};

//
//static void ide_data_out(struct ide_drive *d, uint16_t v, int len)
//{
//  if (d->state != IDE_DATA_OUT) {
//    ide_fault(d, "bad data write");
//    d->taskfile.data = v;
//  } else {
//    if (d->eightbit)
//      v &= 0xFF;
//    *d->dptr++ = v;
//    d->taskfile.data = v;
//    if (!d->eightbit) {
//      *d->dptr++ = v >> 8;
//      d->taskfile.data = v >> 8;
//    }
//    if (d->dptr == d->data + 512) {
//      if (ide_write_sector(d) < 0) {
//        ide_set_error(d);
//        return;	
//      }
//      d->length--;
//      d->intrq = 1;
//      if (d->length == 0) {
//        d->state = IDE_IDLE;
//        d->taskfile.status |= ST_DSC;
//        completed(&d->taskfile);
//      }
//    }
//  }
//}
ide.ide_data_out=function(d,v,len){
  if (d.state != ide.IDE_DATA_OUT) {
    ide.ide_fault(d, "bad data write");
    d.taskfile.data = v;
  } else {
    if (d.eightbit)
      v &= 0xFF;
    d.data[d.dptr++] = v;
    d.taskfile.data = v;
    if (!d.eightbit) {
      d.data[d.dptr++] = v >> 8;
      d.taskfile.data = v >> 8;
    }
    if (d.dptr == 512) {
      if (ide.ide_write_sector(d) < 0) {
        ide.ide_set_error(d);
        return;	
      }
      d.length--;
      d.intrq = 1;
      if (d.length == 0) {
        d.state = ide.IDE_IDLE;
        d.taskfile.status |= ide.ST_DSC;
        ide.completed(d.taskfile);
      }
    }
  }
};

//
//static void ide_issue_command(struct ide_taskfile *t)
//{
//  t->status &= ~(ST_ERR|ST_DRDY);
//  t->status |= ST_BSY;
//  t->error = 0;
//  t->drive->state = IDE_CMD;
//  
//  /* We could complete with delays but don't do so yet */
//  switch(t->command) {
//    case IDE_CMD_EDD:	/* 0x90 */
//      cmd_edd_complete(t);
//      break;
//    case IDE_CMD_IDENTIFY:	/* 0xEC */
//      cmd_identify_complete(t);
//      break;
//    case IDE_CMD_INTPARAMS:	/* 0x91 */
//      cmd_initparam_complete(t);
//      break;
//    case IDE_CMD_READ:		/* 0x20 */
//    case IDE_CMD_READ_NR:	/* 0x21 */
//      cmd_readsectors_complete(t);
//      break;
//    case IDE_CMD_SETFEATURES:	/* 0xEF */
//      cmd_setfeatures_complete(t);
//      break;
//    case IDE_CMD_VERIFY:	/* 0x40 */
//    case IDE_CMD_VERIFY_NR:	/* 0x41 */
//      cmd_verifysectors_complete(t);
//      break;
//    case IDE_CMD_WRITE:		/* 0x30 */
//    case IDE_CMD_WRITE_NR:	/* 0x31 */
//      cmd_writesectors_complete(t);
//      break;
//    default:
//      if ((t->command & 0xF0) == IDE_CMD_CALIB)	/* 1x */
//        cmd_recalibrate_complete(t);
//      else if ((t->command & 0xF0) == IDE_CMD_SEEK) /* 7x */
//        cmd_seek_complete(t);
//      else {
//        /* Unknown */
//        t->status |= ST_ERR;
//        t->error |= ERR_ABRT;
//        completed(t);
//      }
//  }
//}
ide.ide_issue_command=function(t){
  t.status &= ~(ide.ST_ERR|ide.ST_DRDY);
  t.status |= ide.ST_BSY;
  t.error = 0;
  t.drive.state = ide.IDE_CMD;
  
  switch(t.command) {
    case ide.IDE_CMD_EDD:	/* 0x90 */
      ide.cmd_edd_complete(t);
      break;
    case ide.IDE_CMD_IDENTIFY:	/* 0xEC */
      ide.cmd_identify_complete(t);
      break;
    case ide.IDE_CMD_INTPARAMS:	/* 0x91 */
      ide.cmd_initparam_complete(t);
      break;
    case ide.IDE_CMD_READ:		/* 0x20 */
    case ide.IDE_CMD_READ_NR:	/* 0x21 */
      ide.cmd_readsectors_complete(t);
      break;
    case ide.IDE_CMD_SETFEATURES:	/* 0xEF */
      ide.cmd_setfeatures_complete(t);
      break;
    case ide.IDE_CMD_VERIFY:	/* 0x40 */
    case ide.IDE_CMD_VERIFY_NR:	/* 0x41 */
      ide.cmd_verifysectors_complete(t);
      break;
    case ide.IDE_CMD_WRITE:		/* 0x30 */
    case ide.IDE_CMD_WRITE_NR:	/* 0x31 */
      ide.cmd_writesectors_complete(t);
      break;
    default:
      if ((t.command & 0xF0) == ide.IDE_CMD_CALIB)	/* 1x */
        ide.cmd_recalibrate_complete(t);
      else if ((t.command & 0xF0) == ide.IDE_CMD_SEEK) /* 7x */
        ide.cmd_seek_complete(t);
      else {
        /* Unknown */
        t.status |= ide.ST_ERR;
        t.error |= ide.ERR_ABRT;
        ide.completed(t);
      }
  }
};

//
///*
// *	8bit IDE controller emulation
// */
//
//uint8_t ide_read8(struct ide_controller *c, uint8_t r)
//{
//  struct ide_drive *d = &c->drive[c->selected];
//  struct ide_taskfile *t = &d->taskfile;
//  switch(r) {
//    case ide_data:
//      return ide_data_in(d, 1);
//    case ide_error_r:
//      return t->error;
//    case ide_sec_count:
//      return t->count;
//    case ide_lba_low:
//      return t->lba1;
//    case ide_lba_mid:
//      return t->lba2;
//    case ide_lba_hi:
//      return t->lba3;
//    case ide_lba_top:
//      return t->lba4;
//    case ide_status_r:
//      d->intrq = 0;		/* Acked */
//    case ide_altst_r:
//      return t->status;
//    default:
//      ide_fault(d, "bogus register");
//      return 0xFF;
//  }
//}
ide.ide_read8=function(c,r){
  var d = c.drive[c.selected];
  var t = d.taskfile;
  switch(r) {
    case ide.ide_data:
      return ide.ide_data_in(d, 1);
    case ide.ide_error_r:
      return t.error;
    case ide.ide_sec_count:
      return t.count;
    case ide.ide_lba_low:
      return t.lba1;
    case ide.ide_lba_mid:
      return t.lba2;
    case ide.ide_lba_hi:
      return t.lba3;
    case ide.ide_lba_top:
      return t.lba4;
    case ide.ide_status_r:
      d.intrq = 0;		/* Acked */
    case ide.ide_altst_r:
      return t.status;
    default:
      ide.ide_fault(d, "bogus register");
      return 0xFF;
  }
};

//
//void ide_write8(struct ide_controller *c, uint8_t r, uint8_t v)
//{
//  struct ide_drive *d = &c->drive[c->selected];
//  struct ide_taskfile *t = &d->taskfile;
//
//  if (r != ide_devctrl_w) {
//    if (t->status & ST_BSY) {
//      ide_fault(d, "command written while busy");
//      return;
//    }
//    /* Not clear this is the right emulation */
//    if (d->present == 0 && r != ide_lba_top) {
//      ide_fault(d, "not present");
//      return;
//    }
//  }
//
//  switch(r) {
//    case ide_data:
//      ide_data_out(d, v, 1);
//      break;
//    case ide_feature_w:
//      t->feature = v;
//      break;
//    case ide_sec_count:
//      t->count = v;
//      break;
//    case ide_lba_low:
//      t->lba1 = v;
//      break;
//    case ide_lba_mid:
//      t->lba2 = v;
//      break;
//    case ide_lba_hi:
//      t->lba3 = v;
//      break;
//    case ide_lba_top:
//      c->selected = (v & DEVH_DEV) ? 1 : 0;
//      c->drive[c->selected].taskfile.lba4 = v & (DEVH_HEAD|DEVH_DEV|DEVH_LBA);
//      break;
//    case ide_command_w:
//      t->command = v; 
//      ide_issue_command(t);
//      break;
//    case ide_devctrl_w:
//      /* ATA: "When the Device Control register is written, both devices
//         respond to the write regardless of which device is selected" */
//      if ((v ^ t->devctrl) & DCL_SRST) {
//        if (v & DCL_SRST)
//          ide_srst_begin(c);
//        else
//          ide_srst_end(c);
//      }
//      c->drive[0].taskfile.devctrl = v;	/* Check versus real h/w does this end up cleared */
//      c->drive[1].taskfile.devctrl = v;
//      break;
//  }
//}
ide.ide_write8=function(c,r,v){
  var d = c.drive[c.selected];
  var t = d.taskfile;

  if (r != ide.ide_devctrl_w) {
    if (t.status & ide.ST_BSY) {
      ide.ide_fault(d, "command written while busy");
      return;
    }
    /* Not clear this is the right emulation */
    if (d.present == 0 && r != ide.ide_lba_top) {
      ide.ide_fault(d, "not present");
      return;
    }
  }

  switch(r) {
    case ide.ide_data:
      ide.ide_data_out(d, v, 1);
      break;
    case ide.ide_feature_w:
      t.feature = v;
      break;
    case ide.ide_sec_count:
      t.count = v;
      break;
    case ide.ide_lba_low:
      t.lba1 = v;
      break;
    case ide.ide_lba_mid:
      t.lba2 = v;
      break;
    case ide.ide_lba_hi:
      t.lba3 = v;
      break;
    case ide.ide_lba_top:
      c.selected = (v & ide.DEVH_DEV) ? 1 : 0;
      c.drive[c.selected].taskfile.lba4 = v & (ide.DEVH_HEAD|ide.DEVH_DEV|ide.DEVH_LBA);
      break;
    case ide.ide_command_w:
      t.command = v; 
      ide.ide_issue_command(t);
      break;
    case ide.ide_devctrl_w:
      /* ATA: "When the Device Control register is written, both devices
         respond to the write regardless of which device is selected" */
      if ((v ^ t.devctrl) & ide.DCL_SRST) {
        if (v & ide.DCL_SRST)
          ide.ide_srst_begin(c);
        else
          ide.ide_srst_end(c);
      }
      c.drive[0].taskfile.devctrl = v;	/* Check versus real h/w does this end up cleared */
      c.drive[1].taskfile.devctrl = v;
      break;
  }
};

//
///*
// *	16bit IDE controller emulation
// */
//
//uint16_t ide_read16(struct ide_controller *c, uint8_t r)
//{
//  struct ide_drive *d = &c->drive[c->selected];
//  if (r == ide_data)
//    return ide_data_in(d,2);
//  return ide_read8(c, r);
//}
//
//void ide_write16(struct ide_controller *c, uint8_t r, uint16_t v)
//{
//  struct ide_drive *d = &c->drive[c->selected];
//  struct ide_taskfile *t = &d->taskfile;
//
//  if (r != ide_devctrl_w && (t->status & ST_BSY)) {
//    ide_fault(d, "command written while busy");
//    return;
//  }
//  if (r == ide_data)
//    ide_data_out(d, v, 2);
//  else
//    ide_write8(c, r, v);
//}
//
///*
// *	Allocate a new IDE controller emulation
// */
//struct ide_controller *ide_allocate(const char *name)
//{
//  struct ide_controller *c = calloc(1, sizeof(*c));
//  if (c == NULL)
//    return NULL;
//  c->name = strdup(name);
//  if (c->name == NULL) {
//    free(c);
//    return NULL;
//  }
//  c->drive[0].controller = c;
//  c->drive[1].controller = c;
//  c->drive[0].taskfile.drive = &c->drive[0];
//  c->drive[1].taskfile.drive = &c->drive[1];
//  return c;
//}
//
///*
// *	Attach a file to a device on the controller
// */
//int ide_attach(struct ide_controller *c, int drive, int fd)
//{
//  struct ide_drive *d = &c->drive[drive];
//  if (d->present) {
//    ide_fault(d, "double attach");
//    return -1;
//  }
//  d->fd = fd;
//  if (read(d->fd, d->data, 512) != 512 ||
//      read(d->fd, d->identify, 512) != 512) {
//    ide_fault(d, "i/o error on attach");
//    return -1;
//  }
//  if (memcmp(d->data, ide_magic, 8)) {
//    ide_fault(d, "bad magic");
//    return -1;
//  }
//  d->fd = fd;
//  d->present = 1;
//  d->heads = d->identify[3];
//  d->sectors = d->identify[6];
//  d->cylinders = le16(d->identify[1]);
//  if (d->identify[49] & le16(1 << 9))
//    d->lba = 1;
//  else
//    d->lba = 0;
//  return 0;
//}
//
///*
// *	Detach an IDE device from the interface (not hot pluggable)
// */
//void ide_detach(struct ide_drive *d)
//{
//  close(d->fd);
//  d->fd = -1;
//  d->present = 0;
//}
//
///*
// *	Free up and release and IDE controller
// */  
//void ide_free(struct ide_controller *c)
//{
//  if (c->drive[0].present)
//    ide_detach(&c->drive[0]);
//  if (c->drive[1].present)
//    ide_detach(&c->drive[1]);
//  free((void *)c->name);
//  free(c);
//}
/*
 * main() in searle.c
 */
//	ide0 = ide_allocate("cf");
//	if (ide0) {
//		fd = open(idepath, O_RDWR);
//		if (fd == -1) {
//			perror(idepath);
//			ide = 0;
//		}
//		if (ide_attach(ide0, 0, fd) == 0) {
//			ide = 1;
//			ide_reset_begin(ide0);
//		}
//	}



/*
 * Structures follow
 */
ide.structures=function(){
	// ide_contoller structure
	ide.ide0=new Object();
	ide.ide0.drive=new Array(2);
	ide.ide0.drive[0]=new Object();
	ide.ide0.drive[1]=new Object();
//	ide.ide0.drive[1]=ide.ide0.drive[0];
	ide.ide0.selected=0;
	ide.ide0.name="cf";
	ide.ide0.data_latch=0;

	//ide_drive structure
	ide.ide0.drive[0].controller=ide.ide0;
	ide.ide0.drive[0].taskfile=new Object();
	ide.ide0.drive[0].present=1;
	ide.ide0.drive[0].intrq=0;
	ide.ide0.drive[0].failed=0;
	ide.ide0.drive[0].lba=1;
	ide.ide0.drive[0].eightbit=0;
	ide.ide0.drive[0].cylinders=1024;
	ide.ide0.drive[0].heads=16;
	ide.ide0.drive[0].sectors=16;
	ide.ide0.drive[0].data=new Array(512);
	ide.read(0,ide.ide0.drive[0].data,512);
	ide.ide0.drive[0].identify=new Array(512); // 256 word = 512 bytes.
	ide.read(0,ide.ide0.drive[0].identify,512);
	ide.ide0.drive[0].dptr=0;
	ide.ide0.drive[0].state=0;
	ide.ide0.drive[0].fd=0;
	ide.ide0.drive[0].offset=0;
	ide.ide0.drive[0].length=0;

	ide.ide0.drive[1].controller=ide.ide0;
	ide.ide0.drive[1].taskfile=new Object();
	ide.ide0.drive[1].present=0;
	ide.ide0.drive[1].intrq=0;
	ide.ide0.drive[1].failed=0;
	ide.ide0.drive[1].lba=1;
	ide.ide0.drive[1].eightbit=0;
	ide.ide0.drive[1].cylinders=1024;
	ide.ide0.drive[1].heads=16;
	ide.ide0.drive[1].sectors=16;
	ide.ide0.drive[1].data=new Array(512);
	ide.ide0.drive[1].identify=new Array(512); // 256 word = 512 bytes.
	ide.ide0.drive[1].dptr=0;
	ide.ide0.drive[1].state=0;
	ide.ide0.drive[1].fd=0;
	ide.ide0.drive[1].offset=0;
	ide.ide0.drive[1].length=0;

	//ide_taskfile structure
	ide.ide0.drive[0].taskfile.data=0;
	ide.ide0.drive[0].taskfile.error=0;
	ide.ide0.drive[0].taskfile.feature=0;
	ide.ide0.drive[0].taskfile.count=0;
	ide.ide0.drive[0].taskfile.lba1=0;
	ide.ide0.drive[0].taskfile.lba2=0;
	ide.ide0.drive[0].taskfile.lba3=0;
	ide.ide0.drive[0].taskfile.lba4=0;
	ide.ide0.drive[0].taskfile.status=ide.ST_DRDY;
	ide.ide0.drive[0].taskfile.command=0;
	ide.ide0.drive[0].taskfile.devctrl=0;
	ide.ide0.drive[0].taskfile.drive=ide.ide0.drive[0];

	ide.ide0.drive[1].taskfile.data=0;
	ide.ide0.drive[1].taskfile.error=0;
	ide.ide0.drive[1].taskfile.feature=0;
	ide.ide0.drive[1].taskfile.count=0;
	ide.ide0.drive[1].taskfile.lba1=0;
	ide.ide0.drive[1].taskfile.lba2=0;
	ide.ide0.drive[1].taskfile.lba3=0;
	ide.ide0.drive[1].taskfile.lba4=0;
	ide.ide0.drive[1].taskfile.status=0;
	ide.ide0.drive[1].taskfile.command=0;
	ide.ide0.drive[1].taskfile.devctrl=0;
	ide.ide0.drive[1].taskfile.drive=ide.ide0.drive[1];
};
//
///*
// *	Emulation interface for an 8bit controller using latches on the
// *	data register
// */
//uint8_t ide_read_latched(struct ide_controller *c, uint8_t reg)
//{
//  uint16_t v;
//  if (reg == ide_data_latch)
//    return c->data_latch;
//  v = ide_read16(c, reg);
//  if (reg == ide_data) {
//    c->data_latch = v >> 8;
//    v &= 0xFF;
//  }
//  return v;
//}
//
//void ide_write_latched(struct ide_controller *c, uint8_t reg, uint8_t v)
//{
//  uint16_t d = v;
//
//  if (reg == ide_data_latch) {
//    c->data_latch = v;
//    return;
//  }
//  if (reg == ide_data)
//    d |=  (c->data_latch << 8);
//  ide_write16(c, reg, d);  
//}
//
//static void make_ascii(uint16_t *p, const char *t, int len)
//{
//  int i;
//  char *d = (char *)p;
//  strncpy(d, t, len);
//
//  for (i = 0; i < len; i += 2) {
//    char c = *d;
//    *d = d[1];
//    d[1] = c;
//    d += 2;
//  }  
//}
//
//static void make_serial(uint16_t *p)
//{
//  char buf[21];
//  srand(getpid()^time(NULL));
//  snprintf(buf, 21, "%08d%08d%04d", rand(), rand(), rand());
//  make_ascii(p, buf, 20);
//}
//
//int ide_make_drive(uint8_t type, int fd)
//{
//  uint8_t s, h;
//  uint16_t c;
//  uint32_t sectors;
//  uint16_t ident[256];
//
//  if (type < 1 || type > MAX_DRIVE_TYPE)
//    return -2;
//  
//  memset(ident, 0, 512);
//  memcpy(ident, ide_magic, 8);
//  if (write(fd, ident, 512) != 512)
//    return -1;
//
//  memset(ident, 0, 8);
//  ident[0] = le16((1 << 15) | (1 << 6));	/* Non removable */
//  make_serial(ident + 10);
//  ident[47] = 0; /* no read multi for now */
//  ident[51] = le16(240 /* PIO2 */ << 8);	/* PIO cycle time */
//  ident[53] = le16(1);		/* Geometry words are valid */
//  
//  switch(type) {
//    case ACME_ROADRUNNER:
//      /* 504MB drive with LBA support */
//      c = 1024;
//      h = 16;
//      s = 63;
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME ROADRUNNER v0.1", 40);
//      ident[49] = le16(1 << 9); /* LBA */
//      break;  
//    case ACME_ULTRASONICUS:
//      /* 40MB drive with LBA support */
//      c = 977;
//      h = 5;
//      s = 16;
//      ident[49] = le16(1 << 9); /* LBA */
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME ULTRASONICUS AD INFINITUM v0.1", 40);
//      break;
//    case ACME_NEMESIS:
//      /* 20MB drive with LBA support */
//      c = 615;
//      h = 4;
//      s = 16;
//      ident[49] = le16(1 << 9); /* LBA */
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME NEMESIS RIDICULII v0.1", 40);
//      break;
//    case ACME_COYOTE:
//      /* 20MB drive without LBA support */
//      c = 615;
//      h = 4;
//      s = 16;
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME COYOTE v0.1", 40);
//      break;  
//    case ACME_ACCELLERATTI:
//      c = 1024;
//      h = 16;
//      s = 16;
//      ident[49] = le16(1 << 9); /* LBA */
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME ACCELLERATTI INCREDIBILUS v0.1", 40);
//      break;
//    case ACME_ZIPPIBUS:
//      c = 1024;
//      h = 16;
//      s = 32;
//      ident[49] = le16(1 << 9); /* LBA */
//      make_ascii(ident + 23, "A001.001", 8);
//      make_ascii(ident + 27, "ACME ZIPPIBUS v0.1", 40);
//      break;
//  }
//  ident[1] = le16(c);
//  ident[3] = le16(h);
//  ident[6] = le16(s);
//  ident[54] = ident[1];
//  ident[55] = ident[3];
//  ident[56] = ident[6];
//  sectors = c * h * s;
//  ident[57] = le16(sectors & 0xFFFF);
//  ident[58] = le16(sectors >> 16);
//  ident[60] = ident[57];
//  ident[61] = ident[58];
//  if (write(fd, ident, 512) != 512)
//    return -1;
//  
//  memset(ident, 0xE5, 512);
//  while(sectors--)
//    if (write(fd, ident, 512) != 512)
//      return -1;  
//  return 0;
//}
