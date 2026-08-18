from HAC.models import Expense
from HAC.serializers import ExpenseSerializer
from .common_service import CommonService

class ExpenseService:

    @staticmethod
    def create_expense(owner_id, data, files):
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        expense = Expense.objects.create(
            owner=owner,
            category=data.get('category'),
            description=data.get('description'),
            amount=data.get('amount'),
            date=data.get('date')
        )
        return ExpenseSerializer(expense).data

    @staticmethod
    def get_expenses(owner_id):
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        expenses = Expense.objects.filter(owner=owner).order_by('-date')
        return ExpenseSerializer(expenses, many=True).data

    @staticmethod
    def update_expense(expense_id, owner_id, data, files):
        try:
            expense = Expense.objects.get(id=expense_id)
        except Expense.DoesNotExist:
            raise Exception("Expense not found")
 
        # Verify that the expense belongs to the requesting owner
        if owner_id and str(expense.owner.owner_id) != str(owner_id):
            raise Exception("You do not have permission to edit this expense.")
 
        serializer = ExpenseSerializer(expense, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return {"message": "Expense updated successfully", "data": serializer.data}
        raise ValueError(serializer.errors)
 
    @staticmethod
    def delete_expense(expense_id, owner_id):
        try:
            expense = Expense.objects.get(id=expense_id)
        except Expense.DoesNotExist:
            raise Exception("Expense not found")
 
        # Verify that the expense belongs to the requesting owner
        if owner_id and str(expense.owner.owner_id) != str(owner_id):
            raise Exception("You do not have permission to delete this expense.")
 
        expense.delete()
        return {"message": "Expense deleted successfully"}
 

    @staticmethod
    def get_owner_expense_history(owner_id):
        owner = CommonService.get_owner(owner_id)
        if not owner:
            raise Exception("Owner not found")

        expenses = Expense.objects.filter(owner=owner).order_by('-date')
        return ExpenseSerializer(expenses, many=True).data
