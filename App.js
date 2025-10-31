import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';

// Note: sounds are optional. To enable sounds install expo-av in your project:
// expo install expo-av
// The code will attempt to load expo-av and fall back silently if it's not present.

const COLORS = [
  { id: 0, color: '#2ecc71' }, // green
  { id: 1, color: '#f1c40f' }, // yellow
  { id: 2, color: '#e74c3c' }, // red
  { id: 3, color: '#3498db' }, // blue
];

// Public short sound files (optional). If you prefer local assets, replace the URIs with local requires.
const SOUND_URLS = [
  'https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg',
  'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
  'https://actions.google.com/sounds/v1/cartoon/doorbell_chime.ogg',
  'https://actions.google.com/sounds/v1/cartoon/metal_thud.ogg',
];

export default function App() {
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState('Press Start to play');
  const [level, setLevel] = useState(0);
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  const animValues = useRef(COLORS.map(() => new Animated.Value(1))).current;
  const soundsRef = useRef([]);

  useEffect(() => {
    // Try to load expo-av if available
    let mounted = true;
    (async () => {
      try {
        const { Audio } = require('expo-av');
        await Audio.setIsEnabledAsync(true);
        const loaded = [];
        for (let i = 0; i < SOUND_URLS.length; i++) {
          const soundObj = new Audio.Sound();
          try {
            await soundObj.loadAsync({ uri: SOUND_URLS[i] });
            loaded.push(soundObj);
          } catch (e) {
            // ignore individual load errors
            // console.log('sound load failed', e);
          }
        }
        if (mounted) {
          soundsRef.current = loaded;
          setSoundsLoaded(loaded.length > 0);
        }
      } catch (e) {
        // expo-av not installed — sounds will be disabled
        // console.log('expo-av not available', e);
        setSoundsLoaded(false);
      }
    })();
    return () => {
      mounted = false;
      // unload sounds
      (async () => {
        try {
          for (const s of soundsRef.current) {
            await s.unloadAsync();
          }
        } catch (e) {}
      })();
    };
  }, []);

  function vibrate() {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      Vibration.vibrate(30);
    }
  }

  const flash = (index) => {
    return new Promise((res) => {
      Animated.sequence([
        Animated.timing(animValues[index], {
          toValue: 1.6,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animValues[index], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => res());
    });
  };

  const playSound = async (index) => {
    try {
      const s = soundsRef.current[index];
      if (s) {
        await s.replayAsync();
      }
    } catch (e) {
      // ignore
    }
  };

  const playSequence = async (seq) => {
    setIsPlaying(true);
    setMessage('Watch the sequence');
    for (let i = 0; i < seq.length; i++) {
      const idx = seq[i];
      await flash(idx);
      await playSound(idx);
      vibrate();
      // small gap
      await new Promise((r) => setTimeout(r, 250));
    }
    setIsPlaying(false);
    setMessage('Your turn');
    setPlayerIndex(0);
  };

  const nextRound = async (oldSeq = sequence) => {
    const next = [...oldSeq, Math.floor(Math.random() * COLORS.length)];
    setSequence(next);
    setLevel(next.length);
    await new Promise((r) => setTimeout(r, 500));
    await playSequence(next);
  };

  const handlePress = async (index) => {
    if (isPlaying) return;
    // animate locally
    await flash(index);
    await playSound(index);
    vibrate();
    const expected = sequence[playerIndex];
    if (index === expected) {
      const nextIndex = playerIndex + 1;
      if (nextIndex === sequence.length) {
        setMessage('Correct! Next round...');
        setPlayerIndex(0);
        await new Promise((r) => setTimeout(r, 700));
        await nextRound(sequence);
      } else {
        setPlayerIndex(nextIndex);
      }
    } else {
      setMessage('Wrong! Game over. Press Start to play again');
      // flash all to indicate error
      for (let i = 0; i < 2; i++) {
        await Promise.all(COLORS.map((_, idx) => flash(idx)));
      }
      setSequence([]);
      setLevel(0);
    }
  };

  const startGame = async () => {
    setSequence([]);
    setPlayerIndex(0);
    setLevel(0);
    setMessage('Get ready...');
    await new Promise((r) => setTimeout(r, 300));
    await nextRound([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Genius (Simon)</Text>
      <Text style={styles.level}>Level: {level}</Text>

      <View style={styles.board}>
        {COLORS.map((c, idx) => (
          <TouchableOpacity
            key={c.id}
            activeOpacity={0.8}
            onPress={() => handlePress(idx)}
            disabled={isPlaying || sequence.length === 0}
            style={styles.cellWrap}
          >
            <Animated.View
              style={[
                styles.cell,
                { backgroundColor: c.color, transform: [{ scale: animValues[idx] }] },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.msg}>{message}</Text>

      <TouchableOpacity style={styles.button} onPress={startGame}>
        <Text style={styles.buttonText}>Start</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        {soundsLoaded
          ? 'Sounds enabled'
          : 'Sounds disabled — run "expo install expo-av" to enable audio'}
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  level: {
    color: '#ddd',
    marginBottom: 16,
    fontSize: 16,
  },
  board: {
    width: 320,
    height: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  cellWrap: {
    width: '50%',
    height: '50%',
    padding: 12,
  },
  cell: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  msg: {
    color: '#fff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#8e44ad',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  hint: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 12,
  },
});
