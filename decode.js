export function bytes2int16(bytes) {
    var view = new DataView(new ArrayBuffer(2));
    view.setUint8(0, bytes[1]);
    view.setUint8(1, bytes[0]);
    return view.getInt16(0, true); // true indicates little-endian byte order
  }
  