from flask import Flask
import lumiversepython as L
import time
import math
import multiprocessing,Queue
from threading import Thread,Lock

DEBUG=True
USE_DEBUGGER=True
app=Flask(__name__)

rig = L.Rig("/home/teacher/Lumiverse/PBridge.rig.json")

rig.init()
# rig.run()

panels = [rig.select("$panel=%d"%x) for x in xrange(57)]

colors = [(0,0,0) for p in panels]

colorLock = Lock()

def setColor(i,c):
    colors[i] = c

def setColorLock(i,c):
    colorLock.acquire()
    colors[i] = c
    colorLock.release()

def updateLights():
    while(1):
        with colorLock:
            for i,c in enumerate(colors):
                (r,g,b) = c
                panels[i].setRGBRaw(2**r-1,2**g-1,2**b-1)
        rig.updateOnce()
        time.sleep(0.025)

"""
    use weight parameter (last (optional) parameter in setColorRGBRaw) to fade in colors...
    use the blank template to disable pharos 
"""
def flash(c):
    print "flash (%f,%f,%f)" % c
    with colorLock:
        for i in xrange(len(panels)):
            setColor(i,c)
    # rig.updateOnce()

def off():
    flash((0,0,0))
    # rig.updateOnce()

def wrap(n,x):
    while x < 0:
        x += n
    return x%n

def fade(factor=0.97):
    for ix in xrange(len(panels)):
        (r,g,b) = colors[ix]
        colors[ix] = (factor*r,factor*g,factor*b)

def wave():
    for i in xrange(2*len(panels)):
        i = i%len(panels)
        with colorLock:
            fade()
            setColor(wrap(len(panels),i-2),(1,0,0))
            setColor(wrap(len(panels),i-1),(0,1,0))
            setColor(i,(0,0,1))
        time.sleep(0.05)

def colorAdd(a,b):
    return (a[0]+b[0],a[1]+b[1],a[2]+b[2])

def colorMult(x,c):
    return (x*c[0],x*c[1],x*c[2])

def collider():
    ax = 0
    bx = len(panels)-1
    v = 0.001
    while(ax <= len(panels)-1 and bx >= 0):
        ax += v/2
        bx -= v/2
        if ax <= bx:
            v *= 1.085
        else:
            v = max(0.94*v,0.2)

        acolor = (1,1,1) if ax <= bx else (1,0,0)
        bcolor = (1,1,1) if ax <= bx else (0.8,156/255.0,0)

        with colorLock:
            if ax < bx:
                fade(0.8)
            else:
                fade(0.985)
            lowBx = max(int(math.floor(bx)),0)
            highAx = min(int(math.ceil(ax)),len(panels)-1)
            frac = bx - lowBx
            colors[highAx] = acolor
            colors[lowBx] = bcolor
            if highAx >= 1:
                ix = highAx-1
                colors[ix] = colorAdd(colorMult(frac,acolor),
                                        colorMult((1-frac),colors[ix]))
            if lowBx <= len(panels)-1:
                ix = lowBx+1
                colors[ix] = colorAdd(colorMult(frac,bcolor),
                                        colorMult((1-frac),colors[ix]))

        time.sleep(0.025)
    while sum((c[0] + c[1] + c[2])/3.0 for c in
            colors)/float(len(panels)) > 0.01:
        with colorLock:
            fade(0.98)
        time.sleep(0.025)
    off()

def runRgb():
    flash((1,0,0))
    time.sleep(1)
    flash((0,1,0))
    time.sleep(1)
    flash((0,0,1))
    time.sleep(1)
    off()

def step():
	for x in xrange(100):
		rig.select("panel=%d"%x).setColorRGBRaw("color",1,1,1)
		raw_input("Current number is %d, TURNED ON"%x)
		rig.select("panel=%d"%x).setColorRGBRaw("color",0,0,0)
		raw_input("Move on to next one?")

effectQueue = multiprocessing.Queue(5)

@app.route('/runeffect/<effect>')
def sendEffect(effect):
    effectQueue.put(effect)
    return ""

users = {}

@app.route('/touch/',methods=['POST'])
def getTouch():
    obj = request.args
    try:
        state = {}
        state['x'] = obj['x']
        state['vel'] = obj['speed']
        state['type'] = obj['type']
        state['color'] = obj['color']
        state['id'] = obj['id']
        if obj['id'] not in users:
            users[obj]['id'] = []
        users[obj['id']].append(state)
        print repr(state)
    except:
        return Response("",400,{})

def runFlask():
    app.run(host='0.0.0.0',threaded=True)

multiprocessing.Process(target=runFlask).start()

bg_thread = Thread(target=updateLights)
bg_thread.setDaemon(True)
bg_thread.start()

effectRunning = Lock()

def runEffect(effect):
    with effectRunning:
        print "Running " + str(effect)
        {
            'rgb':runRgb,
            'wave':wave,
            'collide':collider
        }[effect]()
        print "Done"
        off()

while True:
    try:
        x = effectQueue.get_nowait()
        t = Thread(target=runEffect,args=[x])
        t.setDaemon(True)
        t.start()
    except Queue.Empty:
        pass
    time.sleep(0.1)

