# crypto
## BitStorm
### Description
A custom pseudo-random number generator uses a 256-byte seed (the flag content, null-padded) split into 32 x 64-bit words as its internal state. It generates 60 outputs via a shift-register style PRNG with XOR, bit shifts, and rotations. We must reverse the PRNG to recover the initial state (the flag).

### Solution
All operations in the PRNG (XOR, shifts, rotations) are linear over GF(2). This means the entire transformation from the 2048-bit initial state to each 64-bit output can be expressed as a matrix multiplication over GF(2):


```
output_bits = M * initial_state_bits  (mod 2)
With 60 outputs of 64 bits each (3840 equations) and 2048 unknown bits, the system is overdetermined. We:

Track the state transform matrix T (2048x2048 over GF(2)) through each PRNG step

At each step, compute the output as a linear function of the initial state bits

Build the full equation system M (3840x2048) and solve via Gaussian elimination

The system has full rank (2048 pivots), giving a unique solution.

Flag: 0xfun{L1n34r_4lg3br4_W1th_Z3_1s_Aw3s0m3}


Copy
import numpy as np

outputs = [11329270341625800450, 14683377949987450496, 11656037499566818711, 14613944493490807838, 370532313626579329, 5006729399082841610, 8072429272270319226, 3035866339305997883, 8753420467487863273, 15606411394407853524, 5092825474622599933, 6483262783952989294, 15380511644426948242, 13769333495965053018, 5620127072433438895, 6809804883045878003, 1965081297255415258, 2519823891124920624, 8990634037671460127, 3616252826436676639, 1455424466699459058, 2836976688807481485, 11291016575083277338, 1603466311071935653, 14629944881049387748, 3844587940332157570, 584252637567556589, 10739738025866331065, 11650614949586184265, 1828791347803497022, 9101164617572571488, 16034652114565169975, 13629596693592688618, 17837636002790364294, 10619900844581377650, 15079130325914713229, 5515526762186744782, 1211604266555550739, 11543408140362566331, 18425294270126030355, 2629175584127737886, 6074824578506719227, 6900475985494339491, 3263181255912585281, 12421969688110544830, 10785482337735433711, 10286647144557317983, 15284226677373655118, 9365502412429803694, 4248763523766770934, 13642948918986007294, 3512868807899248227, 14810275182048896102, 1674341743043240380, 28462467602860499, 1060872896572731679, 13208674648176077254, 14702937631401007104, 5386638277617718038, 8935128661284199759]

N = 2048  # 32 * 64 bits

def int_to_bits(v, nbits=64):
    return [(v >> (nbits - 1 - i)) & 1 for i in range(nbits)]

def bits_to_int(bits):
    v = 0
    for b in bits:
        v = (v << 1) | b
    return v

def get_word_rows(T, word_idx):
    return T[word_idx * 64:(word_idx + 1) * 64].copy()

def set_word_rows(T, word_idx, rows):
    T[word_idx * 64:(word_idx + 1) * 64] = rows

def xor_shift_left(rows, shift):
    result = np.zeros_like(rows)
    result[:64-shift] = rows[shift:]
    return result

def xor_shift_right(rows, shift):
    result = np.zeros_like(rows)
    result[shift:] = rows[:64-shift]
    return result

def xor_rotate_left(rows, rot):
    rot = rot % 64
    if rot == 0: return rows.copy()
    return np.roll(rows, -rot, axis=0)

def xor_rows(a, b):
    return (a + b) % 2

# Build GF(2) linear system
T = np.eye(N, dtype=np.uint8)
M = np.zeros((60 * 64, N), dtype=np.uint8)
output_vec = np.zeros(60 * 64, dtype=np.uint8)

for step in range(60):
    s_rows = [get_word_rows(T, i) for i in range(32)]
    taps = [0, 1, 3, 7, 13, 22, 28, 31]
    new_val_rows = np.zeros((64, N), dtype=np.uint8)

    for tap_i in taps:
        val_rows = s_rows[tap_i]
        mixed = xor_rows(xor_rows(val_rows, xor_shift_left(val_rows, 11)), xor_shift_right(val_rows, 7))
        mixed = xor_rotate_left(mixed, (tap_i * 3) % 64)
        new_val_rows = xor_rows(new_val_rows, mixed)

    extra = xor_rows(xor_shift_right(s_rows[31], 13), xor_shift_left(s_rows[31], 5))
    new_val_rows = xor_rows(new_val_rows, extra)

    new_T = np.zeros_like(T)
    for i in range(31):
        set_word_rows(new_T, i, s_rows[i + 1])
    set_word_rows(new_T, 31, new_val_rows)
    T = new_T

    s_rows_new = [get_word_rows(T, i) for i in range(32)]
    out_rows = np.zeros((64, N), dtype=np.uint8)
    for i in range(32):
        if i % 2 == 0:
            out_rows = xor_rows(out_rows, s_rows_new[i])
        else:
            val_rows = s_rows_new[i]
            out_rows = xor_rows(out_rows, xor_rows(xor_shift_right(val_rows, 2), xor_shift_left(val_rows, 62)))

    M[step * 64:(step + 1) * 64] = out_rows
    output_vec[step * 64:(step + 1) * 64] = int_to_bits(outputs[step], 64)

# Gaussian elimination over GF(2)
aug = np.hstack([M, output_vec.reshape(-1, 1)])
rows, cols = aug.shape
pivot_row = 0
pivot_cols = []

for col in range(N):
    found = -1
    for row in range(pivot_row, rows):
        if aug[row, col] == 1:
            found = row
            break
    if found == -1: continue
    if found != pivot_row:
        aug[[pivot_row, found]] = aug[[found, pivot_row]]
    mask = aug[:, col].astype(bool)
    mask[pivot_row] = False
    aug[mask] ^= aug[pivot_row]
    pivot_cols.append(col)
    pivot_row += 1

solution = np.zeros(N, dtype=np.uint8)
for i, col in enumerate(pivot_cols):
    solution[col] = aug[i, -1]

seed_int = bits_to_int([int(b) for b in solution])
content_bytes = seed_int.to_bytes(256, 'big').rstrip(b'\x00')
flag = f"0xfun{{{content_bytes.decode('ascii')}}}"
print(f"Flag: {flag}")
```