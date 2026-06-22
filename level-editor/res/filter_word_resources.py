def filter_freq():
    input_file = open('raw_word_frequency.csv', 'r')
    output_file = open('word_freq.csv', 'w')

    hit_header = False
    for line in input_file:
        if not hit_header:
            hit_header = True
            output_file.write('word,commonality\n')
            continue

        values = line.strip().split(',')
        if not (len(values[0]) >= 3 and len(values[0]) <= 8):
            continue

        commonality = len(values[1]) - 4
        output_file.write(values[0] + ',' + str(commonality) + '\n')

    input_file.close()
    output_file.close()

def filter_word_list():
    input_file = open('raw_word_list.txt', 'r')
    output_file = open('word_list.txt', 'w')

    for line in input_file:
        word = line.strip()
        if not (len(word) >= 3 and len(word) <= 8):
            continue

        output_file.write(line)

    input_file.close()
    output_file.close()


# filter_freq()
filter_word_list()