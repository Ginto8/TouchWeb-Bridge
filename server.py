from flask import Flask,render_template,request,make_response
import flask.json as json
import lumiversepython as L
import time
import math
import multiprocessing,Queue
from threading import Thread,Lock
import threading as T
import logging


def setup_custom_logger(name):
    formatter = logging.Formatter(fmt='%(asctime)s - %(levelname)s - %(module)s - %(message)s')

    handler = logging.StreamHandler()
    handler.setFormatter(formatter)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)
    return logger

log = setup_custom_logger('root')

DEBUG=True
USE_DEBUGGER=True
app=Flask(__name__)

rig = L.Rig("/home/teacher/Lumiverse/PBridge.rig.json")

rig.init()
# rig.run()

panels = [rig.select("$panel=%d"%x) for x in xrange(57)]

colors = [(0,0,0) for p in panels]
objects = []

colorLock = Lock()
objectLock = Lock()

def setColor(i,c):
    colors[i] = c

def setColorLock(i,c):
    colorLock.acquire()
    colors[i] = c
    colorLock.release()

timeStep = 0.025

def updateLights():
    global objects
    while(1):
        with colorLock:
            with objectLock:
                newObjects = []
                for x,v,color in objects:
                    i = int(x+0.5)
                    if i >= 0 and i < len(colors):
                        colors[i] = colorMix(colors[i],color)
                        newX = x + v*timeStep
                        newObjects.append((newX,v,color))
                objects = newObjects
            for i,c in enumerate(colors):
                (r,g,b) = c
                panels[i].setRGBRaw(2**r-1,2**g-1,2**b-1)
        rig.updateOnce()
        time.sleep(timeStep)

"""
    use weight parameter (last (optional) parameter in setColorRGBRaw) to fade in colors...
    use the blank template to disable pharos 
"""
def flash(c):
    log.info("flash (%f,%f,%f)" % c)
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

effectQueue = multiprocessing.Queue(50)

@app.route('/runeffect/<effect>')
def sendEffect(effect):
    effectQueue.put_nowait(effect)
    return ""

@app.route('/ui')
def ui():
    return render_template("index.html")

@app.route('/api/touch',methods=['POST'])
def getTouch():
    log.info("getTouch")
    obj = request.json
    try:
        log.info( repr(obj))
        state = {}
        state['x'] = 1-obj['x']
        state['vel'] = obj['speed']
        state['type'] = obj['type']
        state['color'] = obj['color']
        state['id'] = obj['id']
        # print repr(state)
        # if obj['id'] not in users:
        #     users[str(obj['id'])] = []
        # users[obj['id']].append(state)
        # print repr(state)
        sendEffect(state)
        return json.jsonify(state)
    except Exception as e:
        log.info( repr(e))
        return make_response("",400,{})

def runFlask():
    app.run(host='0.0.0.0',threaded=True)

multiprocessing.Process(target=runFlask).start()

bg_thread = Thread(target=updateLights)
bg_thread.setDaemon(True)
bg_thread.start()

effectRunning = Lock()

events = Queue.Queue(50)

pans = {}

def colorMix(a,b):
    gammaA,gammaB = [2**x-1 for x in a],[2**x-1 for x in b]
    amax,bmax = max(gammaA),max(gammaB)
    # norm = max(amax,bmax)
    if bmax < 0.01:
        return a
    elif amax < 0.01:
        return b
    newcolor = [(a/amax)+(b/bmax) for a,b in zip(gammaA,gammaB)]
    norm = max(newcolor)
    if norm > 1:
        newcolor = [min(1,c/norm) for c in newcolor]
    return [math.log(x+1,2) for x in newcolor]

def drawEvents():
    global objects
    log.info( "drawEvents")
    nothing = 0
    while nothing < 40*30:
        eventSet = []
        objectSet = []
        now = time.time()
        while True:
            with objectLock:
                try:
                    for e in events.get_nowait():
                        color = [float(x)/255.0 for x in e['color']]
                        x = int(float(e['x'])*len(panels))
                        id = e['id']
                        # if abs(e['vel']) > 5:
                        #         objects.append((x,e['vel'],color))
                        eventSet.append((id,color,x,e['type'] == 'pan'))
                except Queue.Empty:
                    break
        if eventSet == []:
            nothing += 1
        else:
            nothing = 0
        with colorLock:
            fade(0.985)
            for id,color,x,isPan in eventSet:
                x = 1 - x
                if x >= len(colors):
                    continue
                if id not in pans or (isPan and id in pans and now - pans[id][1] >= 0.1):
                    colors[x] = colorMix(colors[x],color)
                else:
                    x0 = pans[id][0]
                    lowx,highx = min(x,x0),min(len(colors),max(x,x0)+1)
                    log.info( '[%d,%d]' % (lowx,highx))
                    for i in xrange(lowx,highx):
                        colors[i] = colorMix(colors[i],color)
                        # setColor(i,color)
                if isPan:
                    pans[id] = (x,now)
                elif id in pans:
                    del pans[id]
        time.sleep(0.025)

def runEffect(effect):
    with effectRunning:
        log.info( "Running " + str(effect))
        {
            'rgb':runRgb,
            'wave':wave,
            'collide':collider,
            'events':drawEvents
        }[effect]()
        log.info( "Done")
        off()

first = True
while True:
    try:
        x = 'events' if first else effectQueue.get_nowait()
        first = False
        if type(x) is dict:
            # print "Enqueuing " + repr(effect)
            try:
                events.put_nowait([x])
            except Queue.Full:
                log.info( repr(x) + " Failed: don't have bridge")
        else:
            t = Thread(target=runEffect,args=[x])
            t.setDaemon(True)
            t.start()
    except Queue.Empty:
        pass
    if effectQueue.empty():
        time.sleep(0.1)

