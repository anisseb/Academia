import { View, Text, StyleSheet, FlatList } from 'react-native';

const mockHistory = [
  {
    id: '1',
    date: '2024-02-20',
    problem: 'Solve for x: 2x + 5 = 13',
    solution: 'x = 4',
  },
  {
    id: '2',
    date: '2024-02-19',
    problem: 'Find the derivative of f(x) = x²',
    solution: 'f\'(x) = 2x',
  },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockHistory}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.problem}>{item.problem}</Text>
            <Text style={styles.solution}>{item.solution}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No history yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#2d2d2d',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  date: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  problem: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  solution: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
  },
});